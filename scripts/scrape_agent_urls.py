import requests
from bs4 import BeautifulSoup
import time
import random
import os
import sys
from typing import Optional, Tuple
from dotenv import load_dotenv

BASE_URL = "https://www.transfermarkt.es"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/126.0.0.0 Safari/537.36"
}

def get_agent_by_player(name: str) -> Tuple[Optional[str], Optional[Tuple[str, str]]]:
    """
    Busca un jugador en Transfermarkt y obtiene su URL de perfil y agente.
    
    Args:
        name: Nombre del jugador a buscar
        
    Returns:
        Tuple con (player_url, agent_info) donde agent_info es (agent_name, agent_url) o None
    """
    try:
        # 1. Buscar el jugador en Transfermarkt
        search_url = f"{BASE_URL}/schnellsuche/ergebnis/schnellsuche"
        params = {"query": name}
        
        print(f"🔍 Buscando jugador: {name}")
        r = requests.get(search_url, params=params, headers=headers, timeout=10)
        r.raise_for_status()
        
        soup = BeautifulSoup(r.text, "html.parser")

        # 2. Tomar el primer resultado de jugador
        player_link = soup.select_one("a.spielprofil_tooltip")
        if not player_link:
            print(f"❌ No se encontró jugador: {name}")
            return None, None
        
        player_href = player_link["href"]
        player_url = BASE_URL + player_href
        print(f"✅ Jugador encontrado: {player_url}")

        # 3. Entrar al perfil del jugador
        r2 = requests.get(player_url, headers=headers, timeout=10)
        r2.raise_for_status()
        soup2 = BeautifulSoup(r2.text, "html.parser")

        # 4. Buscar la sección "Agente"
        agent_span = soup2.find("span", string="Agente:")
        if not agent_span:
            print(f"ℹ️ Jugador sin agente registrado: {name}")
            return player_url, None

        agent_link = agent_span.find_next("a")
        if agent_link:
            agent_name = agent_link.text.strip()
            agent_url = BASE_URL + agent_link["href"]
            print(f"✅ Agente encontrado: {agent_name} - {agent_url}")
            return player_url, (agent_name, agent_url)

        return player_url, None
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión para {name}: {e}")
        return None, None
    except Exception as e:
        print(f"❌ Error inesperado para {name}: {e}")
        return None, None

def scrape_players_from_database():
    """
    Obtiene todos los jugadores de la base de datos y actualiza sus URLs de agente.
    """
    # Cargar variables de entorno
    load_dotenv()
    
    # Agregar el directorio raíz al path para importar módulos
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    from prisma import PrismaClient
    
    # Conectar a la base de datos
    prisma = PrismaClient()
    
    try:
        # Obtener todos los jugadores que no tienen URL de agente
        players = prisma.jugador.find_many(
            where={
                "OR": [
                    {"url_trfm_advisor": None},
                    {"url_trfm_advisor": ""}
                ]
            },
            select={
                "id_player": True,
                "player_name": True,
                "complete_player_name": True
            }
        )
        
        print(f"📊 Encontrados {len(players)} jugadores sin URL de agente")
        
        for i, player in enumerate(players, 1):
            # Usar complete_player_name si está disponible, sino player_name
            full_name = player.get('complete_player_name') or player.get('player_name', '')
            print(f"\n[{i}/{len(players)}] Procesando: {full_name}")
            
            # Obtener información del agente
            player_url, agent_info = get_agent_by_player(full_name)
            
            # Actualizar la base de datos
            update_data = {}
            if player_url:
                update_data['url_trfm_advisor'] = player_url
            
            if agent_info:
                agent_name, agent_url = agent_info
                update_data['url_trfm_advisor'] = agent_url
            
            if update_data:
                prisma.jugador.update(
                    where={"id_player": player['id_player']},
                    data=update_data
                )
                print(f"✅ Actualizado en BD: {update_data}")
            else:
                print(f"❌ No se pudo obtener información para: {full_name}")
            
            # Pausa aleatoria para evitar ser bloqueado
            time.sleep(random.uniform(1, 3))
            
    except Exception as e:
        print(f"❌ Error general: {e}")
    finally:
        prisma.disconnect()

if __name__ == "__main__":
    # Ejemplo de uso individual
    if len(sys.argv) > 1:
        player_name = " ".join(sys.argv[1:])
        player_url, agent = get_agent_by_player(player_name)
        
        print(f"\n📋 Resultado para '{player_name}':")
        print(f"Perfil del jugador: {player_url}")
        if agent:
            print(f"Agente: {agent[0]}")
            print(f"Enlace agente: {agent[1]}")
        else:
            print("No tiene agente registrado.")
    else:
        # Ejecutar scraping para todos los jugadores
        scrape_players_from_database()
