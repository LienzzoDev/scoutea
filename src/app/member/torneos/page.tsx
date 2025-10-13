"use client";

import { Search, FileText } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

import MemberNavbar from "@/components/layout/member-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTournaments } from "@/hooks/tournament/useTournaments";

export default function TorneosPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { torneos = [], loading, error, searchTorneos } = useTournaments();
  
  // Mock values for missing properties
  const total = torneos.length;
  const loadMore = () => console.log('Load more not implemented');

  // Cargar torneos iniciales al montar el componente
  useEffect(() => {
    searchTorneos();
  }, [searchTorneos]); // Solo ejecutar una vez al montar

  // Búsqueda automática cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm === '') {
      // Si no hay término de búsqueda, cargar todos
      searchTorneos();
      return;
    }

    const timeoutId = setTimeout(() => {
      searchTorneos({ search: searchTerm.trim() });
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchTorneos]); // Depender del término de búsqueda y la función

  // Formatear fecha
  const _formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Obtener color del estado
  const _getEstadoColor = (estado: string) => {
    switch (estado) {
      case "planificado":
        return "bg-blue-100 text-blue-800";
      case "en_curso":
        return "bg-green-100 text-green-800";
      case "finalizado":
        return "bg-gray-100 text-gray-800";
      case "cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <MemberNavbar />

      {/* Main Content */}
      <main
        className="max-w-7xl mx-auto px-6 py-8"
        style={{ marginTop: "55px" }}
      >
        {/* Breadcrumbs */}
        <nav className="mb-4">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <span className="text-gray-900 font-medium">Torneos</span>
            </li>
            <li className="flex items-center">
              <span className="mx-2">&gt;</span>
              <span className="text-gray-900 font-medium">Torneos</span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Torneos</h1>
          <p className="text-gray-600 text-sm">
            Click on any tournament card to download its PDF automatically
          </p>
        </div>

        {/* Búsqueda */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar torneos por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-300" />
          </div>
        </div>

        {/* Grid de Torneos */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8C1A10]"></div>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-600">Error loading tournaments</p>
            </CardContent>
          </Card>
        ) : torneos.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">No tournaments found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {torneos.map((torneo) => (
              <Card
                key={torneo.id_torneo}
                className="hover:shadow-lg transition-all duration-200 group cursor-pointer hover:scale-105 hover:border-purple-300"
                onClick={() => {
                  console.log('Tournament clicked:', torneo.nombre);
                }}
              >
                <CardContent className="p-6 text-center">
                  {/* Logo del torneo */}
                  <div className="w-48 h-32 mx-auto mb-4 relative">
                    <Image
                      src="/torneo placeholder.png"
                      alt={`Logo placeholder para ${torneo.nombre}`}
                      width={192}
                      height={128}
                      className="rounded-lg object-contain w-full h-full"
                    />
                    {/* Indicador de PDF */}
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <FileText className="h-3 w-3 text-white" />
                    </div>
                  </div>

                  {/* Solo título del torneo */}
                  <h3 className="text-lg font-bold text-purple-700">
                    {torneo.nombre}
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    {torneo.ciudad ? `${torneo.ciudad}, ` : ''}{torneo.pais || 'Ubicación no especificada'}
                  </p>
                </CardContent>
              </Card>
            ))}

            {/* Botón Cargar Más */}
            {torneos.length < total && (
              <div className="col-span-full text-center mt-8">
                <Button
                  onClick={() =>loadMore()}
                  variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                  Load More Tournaments
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
