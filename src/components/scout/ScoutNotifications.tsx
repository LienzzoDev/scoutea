'use client'

import { Bell, Check, CheckCheck, Loader2, X, AlertCircle } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'

import { Button } from '@/components/ui/button'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  player?: {
    player_name: string
    position_player: string | null
    team_name: string | null
  } | null
}

interface NotificationsData {
  notifications: Notification[]
  unreadCount: number
}

export default function ScoutNotifications() {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<NotificationsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMarkingRead, setIsMarkingRead] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cargar notificaciones cuando se abre el dropdown
  useEffect(() => {
    if (isOpen && !data) {
      fetchNotifications()
    }
  }, [isOpen, data])

  // Polling para actualizar el contador cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000)

    // Cargar al montar
    fetchNotifications()

    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/scout/notifications?limit=20')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/scout/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] })
      })

      // Actualizar estado local
      if (data) {
        setData({
          ...data,
          notifications: data.notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, data.unreadCount - 1)
        })
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      setIsMarkingRead(true)
      await fetch('/api/scout/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      })

      // Actualizar estado local
      if (data) {
        setData({
          ...data,
          notifications: data.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0
        })
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    } finally {
      setIsMarkingRead(false)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // If it's a rejected report, show the popup with the reason
    if (notification.type === 'report_rejected') {
      // Mark as read if not already (and update local state for modal)
      if (!notification.read) {
        await markAsRead(notification.id)
        setSelectedNotification({ ...notification, read: true })
      } else {
        setSelectedNotification(notification)
      }
    } else {
      // For other notification types, just mark as read
      if (!notification.read) {
        markAsRead(notification.id)
      }
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'report_approved':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />
      case 'report_rejected':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />
      case 'player_approved':
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />
      case 'player_rejected':
        return <div className="w-2 h-2 bg-orange-500 rounded-full" />
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `Hace ${diffMins} min`
    } else if (diffHours < 24) {
      return `Hace ${diffHours}h`
    } else if (diffDays < 7) {
      return `Hace ${diffDays}d`
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-5 h-5 text-[#6d6d6d]" />
        {data && data.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-[#8c1a10] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium">
            {data.unreadCount > 9 ? '9+' : data.unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white border border-[#e7e7e7] rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-[#2e3138]">Notificaciones</h3>
            <div className="flex items-center gap-2">
              {data && data.unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={isMarkingRead}
                  className="text-xs text-[#6d6d6d] hover:text-[#8c1a10] p-1 h-auto"
                >
                  {isMarkingRead ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <CheckCheck className="w-3 h-3 mr-1" />
                  )}
                  Marcar todas
                </Button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading && !data ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-[#8c1a10] animate-spin" />
              </div>
            ) : !data?.notifications?.length ? (
              <div className="py-8 text-center">
                <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-[#6d6d6d]">No tienes notificaciones</p>
              </div>
            ) : (
              data.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${
                          !notification.read ? 'text-[#2e3138]' : 'text-[#6d6d6d]'
                        }`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-[#6d6d6d] mt-0.5 line-clamp-2 whitespace-pre-line">
                        {notification.message}
                      </p>
                      {notification.player && (
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.player.player_name}
                          {notification.player.position_player && ` - ${notification.player.position_player}`}
                        </p>
                      )}
                    </div>
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(notification.id)
                        }}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        title="Marcar como leída"
                      >
                        <Check className="w-3 h-3 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {data?.notifications?.length ? (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-center text-[#6d6d6d]">
                Mostrando las últimas {data.notifications.length} notificaciones
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Modal de Rechazo */}
      {selectedNotification && selectedNotification.type === 'report_rejected' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div
            ref={modalRef}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border-b border-red-100">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#2e3138]">{selectedNotification.title}</h3>
                <p className="text-xs text-gray-500">{formatDate(selectedNotification.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-2 hover:bg-red-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              {selectedNotification.player && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-[#2e3138]">
                    {selectedNotification.player.player_name}
                  </p>
                  {selectedNotification.player.position_player && (
                    <p className="text-xs text-gray-500">
                      {selectedNotification.player.position_player}
                      {selectedNotification.player.team_name && ` - ${selectedNotification.player.team_name}`}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium text-[#2e3138]">Motivo del rechazo:</p>
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-sm text-[#2e3138] whitespace-pre-line">
                    {selectedNotification.message.includes('Motivo:')
                      ? selectedNotification.message.split('Motivo:')[1]?.trim() || 'No se proporcionó un motivo específico.'
                      : selectedNotification.message}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <Button
                onClick={() => setSelectedNotification(null)}
                className="w-full bg-[#8c1a10] hover:bg-[#6d1410] text-white"
              >
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
