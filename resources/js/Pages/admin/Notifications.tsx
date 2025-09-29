import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  MessageSquare, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  Clock,
  Users,
  Settings,
  Zap
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';

export default function Notifications() {
  const upcomingFeatures = [
    {
      icon: <Bell className="w-6 h-6" />,
      title: 'Real-time Notifications',
      description: 'Instant alerts for orders, reservations, and system events',
      status: 'planned'
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Broadcast Messages',
      description: 'Send announcements to all staff or specific roles',
      status: 'planned'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Scheduled Notifications',
      description: 'Schedule notifications for future delivery',
      status: 'planned'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Targeted Messaging',
      description: 'Send notifications to specific users or locations',
      status: 'planned'
    },
    {
      icon: <AlertTriangle className="w-6 h-6" />,
      title: 'Priority Alerts',
      description: 'Urgent notifications with different priority levels',
      status: 'planned'
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: 'Notification Preferences',
      description: 'Customize notification settings per user',
      status: 'planned'
    }
  ];

  const notificationTypes = [
    {
      icon: <Info className="w-5 h-5" />,
      type: 'Info',
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      description: 'General information and updates'
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      type: 'Success',
      color: 'bg-green-500/20 text-green-400 border-green-500/30',
      description: 'Successful operations and confirmations'
    },
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      type: 'Warning',
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      description: 'Important warnings and alerts'
    },
    {
      icon: <XCircle className="w-5 h-5" />,
      type: 'Error',
      color: 'bg-red-500/20 text-red-400 border-red-500/30',
      description: 'System errors and critical issues'
    },
    {
      icon: <Bell className="w-5 h-5" />,
      type: 'Order',
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      description: 'Order-related notifications'
    },
    {
      icon: <Zap className="w-5 h-5" />,
      type: 'System',
      color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      description: 'System maintenance and updates'
    }
  ];

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-fuchsia-500 to-pink-500 p-4 rounded-full">
                <Bell className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
              Notifications Management
            </h1>
            <p className="text-gray-400 text-lg">Real-time alerts and messaging system</p>
            
            <div className="mt-6">
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 px-4 py-2 text-lg">
                <Clock className="w-5 h-5 mr-2" />
                Coming Soon
              </Badge>
            </div>
          </motion.div>
        </div>

        {/* Coming Soon Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 backdrop-blur-md">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Advanced Notification System in Development
              </h2>
              <p className="text-gray-300 text-lg mb-6 max-w-3xl mx-auto">
                We're building a comprehensive notification management system that will enable real-time alerts, 
                broadcast messaging, scheduled notifications, and targeted communication across your restaurant operations.
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  variant="secondary"
                  className="border-white/20 hover:bg-white/10"
                  disabled
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Settings
                </Button>
                <Button
                  variant="secondary"
                  className="border-white/20 hover:bg-white/10"
                  disabled
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Notification
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Planned Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Planned Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-to-r from-fuchsia-500 to-pink-500 p-3 rounded-lg">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-lg mb-2">
                          {feature.title}
                        </h4>
                        <p className="text-gray-400 text-sm mb-3">
                          {feature.description}
                        </p>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {feature.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Notification Types Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Notification Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notificationTypes.map((type, index) => (
              <motion.div
                key={type.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={type.color}>
                        <div className="flex items-center gap-1">
                          {type.icon}
                          {type.type}
                        </div>
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {type.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Development Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12 text-center"
        >
          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold text-white mb-3">Development Timeline</h4>
              <p className="text-gray-400 mb-4">
                The notification system is currently in the planning phase. Implementation will include:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                <div className="text-left">
                  <h5 className="font-semibold text-white mb-2">Backend Features:</h5>
                  <ul className="space-y-1">
                    <li>• Database schema for notifications</li>
                    <li>• API endpoints for CRUD operations</li>
                    <li>• Real-time WebSocket integration</li>
                    <li>• Notification scheduling system</li>
                  </ul>
                </div>
                <div className="text-left">
                  <h5 className="font-semibold text-white mb-2">Frontend Features:</h5>
                  <ul className="space-y-1">
                    <li>• Notification management interface</li>
                    <li>• Real-time notification center</li>
                    <li>• User preference settings</li>
                    <li>• Mobile push notifications</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
