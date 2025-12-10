import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Loader2, Users, Shield, Package, LayoutDashboard, Settings, TrendingUp, ShoppingCart, UserCheck, Eye, Download, X, Box, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ProductsManager from '@/components/admin/ProductsManager';

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string | null;
  user_id: string | null;
  items: any;
  total_amount: number;
  currency: string;
  status: string;
  payment_method: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_country: string | null;
  shipping_price: number | null;
  total_with_shipping: number | null;
  tracking_number: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
  paid: 'bg-green-500/20 text-green-700 border-green-500/30',
  cod_pending: 'bg-orange-500/20 text-orange-700 border-orange-500/30',
  shipped: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-700 border-red-500/30',
};

const statusLabels: Record<string, string> = {
  pending: 'Изчакващa',
  paid: 'Платена',
  cod_pending: 'Наложен платеж',
  shipped: 'Изпратена',
  delivered: 'Доставена',
  cancelled: 'Отказана',
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredOrders = orders.filter(order => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = order.customer_name?.toLowerCase().includes(query);
      const emailMatch = order.customer_email?.toLowerCase().includes(query);
      if (!nameMatch && !emailMatch) return false;
    }
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (dateFrom) {
      const orderDate = new Date(order.created_at).setHours(0, 0, 0, 0);
      const fromDate = new Date(dateFrom).setHours(0, 0, 0, 0);
      if (orderDate < fromDate) return false;
    }
    if (dateTo) {
      const orderDate = new Date(order.created_at).setHours(23, 59, 59, 999);
      const toDate = new Date(dateTo).setHours(23, 59, 59, 999);
      if (orderDate > toDate) return false;
    }
    return true;
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      toast.error('Нямате достъп до админ панела');
      navigate('/');
    }
  }, [isAdmin, loading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
      fetchOrders();
    }
  }, [isAdmin]);

  const fetchProfiles = async () => {
    setLoadingProfiles(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Грешка при зареждане на потребителите');
    } else {
      setProfiles(data || []);
    }
    setLoadingProfiles(false);
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Грешка при зареждане на поръчките');
    } else {
      setOrders(data || []);
    }
    setLoadingOrders(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast.error('Грешка при обновяване на статуса');
    } else {
      toast.success('Статусът е обновен');
      fetchOrders();
    }
  };

  const countryLabels: Record<string, string> = {
    BG: 'България',
    GR: 'Гърция',
    RO: 'Румъния',
  };

  const exportOrdersToCSV = () => {
    const headers = ['ID', 'Клиент', 'Email', 'Телефон', 'Държава', 'Град', 'Адрес', 'Продукти', 'Доставка', 'Общо', 'Валута', 'Плащане', 'Статус', 'Дата'];
    
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(order => [
        order.id,
        `"${order.customer_name || ''}"`,
        `"${order.customer_email || ''}"`,
        `"${order.customer_phone || ''}"`,
        `"${countryLabels[order.shipping_country || ''] || order.shipping_country || ''}"`,
        `"${order.shipping_city || ''}"`,
        `"${order.shipping_address || ''}"`,
        Number(order.total_amount).toFixed(2),
        Number(order.shipping_price || 0).toFixed(2),
        Number(order.total_with_shipping || order.total_amount).toFixed(2),
        order.currency,
        order.payment_method === 'cod' ? 'Наложен платеж' : 'Карта',
        statusLabels[order.status] || order.status,
        new Date(order.created_at).toLocaleDateString('bg-BG')
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('CSV файлът е изтеглен');
  };

  const totalRevenue = orders
    .filter(o => o.status === 'paid' || o.status === 'delivered' || o.status === 'shipped')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'cod_pending').length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;

  const monthlyStats = useMemo(() => {
    const months = ['Яну', 'Фев', 'Мар', 'Апр', 'Май', 'Юни', 'Юли', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек'];
    const stats: { month: string; revenue: number; orders: number }[] = [];
    
    // Get last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = months[date.getMonth()];
      
      const monthOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate.getFullYear() === date.getFullYear() && 
               orderDate.getMonth() === date.getMonth() &&
               (o.status === 'paid' || o.status === 'delivered' || o.status === 'shipped');
      });
      
      stats.push({
        month: monthName,
        revenue: monthOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
        orders: monthOrders.length
      });
    }
    
    return stats;
  }, [orders]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Към начало
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Админ Панел</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Поръчки</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Box className="h-4 w-4" />
              <span className="hidden sm:inline">Продукти</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Потребители</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Настройки</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-primary/20 shadow-zen">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Общо приходи</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalRevenue.toFixed(2)} лв.</div>
                  <p className="text-xs text-muted-foreground">От платени поръчки</p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 shadow-zen">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Поръчки</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orders.length}</div>
                  <p className="text-xs text-muted-foreground">{pendingOrders} изчакващи</p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 shadow-zen">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Потребители</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profiles.length}</div>
                  <p className="text-xs text-muted-foreground">Регистрирани</p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 shadow-zen">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Доставени</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedOrders}</div>
                  <p className="text-xs text-muted-foreground">Завършени поръчки</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/20 shadow-zen">
              <CardHeader>
                <CardTitle>Продажби по месеци</CardTitle>
                <CardDescription>Приходи за последните 6 месеца</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toFixed(2)} лв.`, 'Приходи']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 shadow-zen">
              <CardHeader>
                <CardTitle>Последни поръчки</CardTitle>
                <CardDescription>Преглед на последните 5 поръчки</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Няма поръчки</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Клиент</TableHead>
                          <TableHead>Сума</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead>Дата</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.slice(0, 5).map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>{order.customer_name || '-'}</TableCell>
                            <TableCell>{Number(order.total_amount).toFixed(2)} {order.currency}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusColors[order.status] || ''}>
                                {statusLabels[order.status] || order.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(order.created_at).toLocaleDateString('bg-BG')}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="border-primary/20 shadow-zen">
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Всички поръчки
                  </CardTitle>
                  <CardDescription>Управление на поръчки и статуси</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportOrdersToCSV}
                  disabled={filteredOrders.length === 0}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Експорт CSV ({filteredOrders.length})
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <Label htmlFor="search">Търсене</Label>
                    <Input
                      id="search"
                      type="text"
                      placeholder="Име или email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status-filter">Статус</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger id="status-filter" className="w-[160px]">
                        <SelectValue placeholder="Всички" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Всички</SelectItem>
                        <SelectItem value="pending">Изчакващa</SelectItem>
                        <SelectItem value="paid">Платена</SelectItem>
                        <SelectItem value="cod_pending">Наложен платеж</SelectItem>
                        <SelectItem value="shipped">Изпратена</SelectItem>
                        <SelectItem value="delivered">Доставена</SelectItem>
                        <SelectItem value="cancelled">Отказана</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-from">От дата</Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-[160px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-to">До дата</Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-[160px]"
                    />
                  </div>
                  {(statusFilter !== 'all' || dateFrom || dateTo || searchQuery) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStatusFilter('all');
                        setDateFrom('');
                        setDateTo('');
                        setSearchQuery('');
                      }}
                      className="flex items-center gap-1"
                    >
                      <X className="h-4 w-4" />
                      Изчисти
                    </Button>
                  )}
                </div>

                {loadingOrders ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Няма поръчки</p>
                ) : filteredOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Няма поръчки, отговарящи на филтрите</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>№</TableHead>
                          <TableHead>Клиент</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Телефон</TableHead>
                          <TableHead>Държава</TableHead>
                          <TableHead>Адрес</TableHead>
                          <TableHead>Продукти</TableHead>
                          <TableHead>Доставка</TableHead>
                          <TableHead>Общо</TableHead>
                          <TableHead>Плащане</TableHead>
                          <TableHead>Tracking</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead>Дата</TableHead>
                          <TableHead>Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-xs">{order.order_number || order.id.slice(0, 8)}</TableCell>
                            <TableCell className="font-medium">{order.customer_name || '-'}</TableCell>
                            <TableCell>{order.customer_email || '-'}</TableCell>
                            <TableCell>{order.customer_phone || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {countryLabels[order.shipping_country || ''] || order.shipping_country || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate">
                              {order.shipping_city}, {order.shipping_address}
                            </TableCell>
                            <TableCell>{Number(order.total_amount).toFixed(2)} лв.</TableCell>
                            <TableCell>{Number(order.shipping_price || 0).toFixed(2)}</TableCell>
                            <TableCell className="font-semibold">
                              {Number(order.total_with_shipping || order.total_amount).toFixed(2)} лв.
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {order.payment_method === 'cod' ? 'НП' : 'Карта'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {order.tracking_number ? (
                                <span className="font-mono text-xs bg-primary/10 px-2 py-1 rounded">{order.tracking_number}</span>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusColors[order.status] || ''}>
                                {statusLabels[order.status] || order.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(order.created_at).toLocaleDateString('bg-BG')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Select
                                  value={order.status}
                                  onValueChange={(value) => updateOrderStatus(order.id, value)}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Изчакваща</SelectItem>
                                    <SelectItem value="paid">Платена</SelectItem>
                                    <SelectItem value="cod_pending">Наложен платеж</SelectItem>
                                    <SelectItem value="shipped">Изпратена</SelectItem>
                                    <SelectItem value="delivered">Доставена</SelectItem>
                                    <SelectItem value="cancelled">Отказана</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <ProductsManager />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="border-primary/20 shadow-zen">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Регистрирани клиенти
                </CardTitle>
                <CardDescription>Преглед на всички регистрирани потребители</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingProfiles ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : profiles.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Няма регистрирани потребители</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Име</TableHead>
                          <TableHead>Фамилия</TableHead>
                          <TableHead>Телефон</TableHead>
                          <TableHead>Град</TableHead>
                          <TableHead>Адрес</TableHead>
                          <TableHead>Дата на регистрация</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profiles.map((profile) => (
                          <TableRow key={profile.id}>
                            <TableCell>{profile.first_name || '-'}</TableCell>
                            <TableCell>{profile.last_name || '-'}</TableCell>
                            <TableCell>{profile.phone || '-'}</TableCell>
                            <TableCell>{profile.city || '-'}</TableCell>
                            <TableCell>{profile.address || '-'}</TableCell>
                            <TableCell>
                              {new Date(profile.created_at).toLocaleDateString('bg-BG')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="border-primary/20 shadow-zen">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Настройки
                </CardTitle>
                <CardDescription>Конфигурация на магазина</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Информация за магазина</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Домейн</p>
                      <p className="font-medium">gomatcha.bg</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Валута</p>
                      <p className="font-medium">BGN (лв.)</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Методи на плащане</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium">Stripe (Карта)</p>
                        <p className="text-sm text-muted-foreground">Онлайн плащане с карта</p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-700">Активен</Badge>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium">Наложен платеж</p>
                        <p className="text-sm text-muted-foreground">Плащане при доставка</p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-700">Активен</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Администратор</h3>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Текущ потребител</p>
                    <p className="font-medium">{user?.email}</p>
                    <Badge className="mt-2 bg-primary/20 text-primary">Admin</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Order Detail Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Детайли на поръчка
              </DialogTitle>
              <DialogDescription className="flex flex-col gap-1">
                <span>Номер: <span className="font-mono font-bold">{selectedOrder?.order_number || selectedOrder?.id.slice(0, 8)}</span></span>
                <span>{selectedOrder && new Date(selectedOrder.created_at).toLocaleString('bg-BG')}</span>
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div>
                  <h4 className="font-semibold mb-2">Информация за клиента</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Име</p>
                      <p className="font-medium">{selectedOrder.customer_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedOrder.customer_email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Телефон</p>
                      <p className="font-medium">{selectedOrder.customer_phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Метод на плащане</p>
                      <p className="font-medium">
                        {selectedOrder.payment_method === 'cod' ? 'Наложен платеж' : 'Карта'}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Shipping Address */}
                <div>
                  <h4 className="font-semibold mb-2">Адрес за доставка</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Държава</p>
                      <p className="font-medium">
                        {countryLabels[selectedOrder.shipping_country || ''] || selectedOrder.shipping_country || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Метод на доставка</p>
                      <p className="font-medium">
                        {(selectedOrder as any).shipping_method || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Град</p>
                      <p className="font-medium">{selectedOrder.shipping_city || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Цена доставка</p>
                      <p className="font-medium">
                        {Number(selectedOrder.shipping_price || 0).toFixed(2)} {selectedOrder.currency}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Адрес / Автомат</p>
                      <p className="font-medium">{selectedOrder.shipping_address || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Tracking Number */}
                {selectedOrder.tracking_number && (
                  <>
                    <Separator />
                    <div className="bg-primary/10 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Tracking номер</h4>
                      </div>
                      <p className="font-mono text-lg font-bold">{selectedOrder.tracking_number}</p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold mb-2">Продукти</h4>
                  <div className="space-y-3">
                    {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img src={item.image} alt={item.title} className="w-12 h-12 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.variantTitle && `${item.variantTitle} • `}
                              Количество: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <p className="font-medium">
                          {(Number(item.price) * item.quantity).toFixed(2)} {selectedOrder.currency}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Order Summary */}
                <div className="flex justify-between items-center">
                  <div>
                    <Badge variant="outline" className={statusColors[selectedOrder.status] || ''}>
                      {statusLabels[selectedOrder.status] || selectedOrder.status}
                    </Badge>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex justify-between gap-8 text-sm">
                      <span className="text-muted-foreground">Продукти:</span>
                      <span>{Number(selectedOrder.total_amount).toFixed(2)} лв.</span>
                    </div>
                    <div className="flex justify-between gap-8 text-sm">
                      <span className="text-muted-foreground">Доставка:</span>
                      <span>{Number(selectedOrder.shipping_price || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-8 pt-1 border-t">
                      <span className="font-medium">Общо:</span>
                      <span className="text-xl font-bold">
                        {Number(selectedOrder.total_with_shipping || selectedOrder.total_amount).toFixed(2)} лв.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;
