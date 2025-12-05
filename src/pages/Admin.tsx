import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Loader2, Users, Shield, Package, LayoutDashboard, Settings, TrendingUp, ShoppingCart, UserCheck, Eye } from 'lucide-react';
import { toast } from 'sonner';

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

  const totalRevenue = orders
    .filter(o => o.status === 'paid' || o.status === 'delivered' || o.status === 'shipped')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'cod_pending').length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;

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
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Поръчки</span>
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Всички поръчки
                </CardTitle>
                <CardDescription>Управление на поръчки и статуси</CardDescription>
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
                          <TableHead>Email</TableHead>
                          <TableHead>Телефон</TableHead>
                          <TableHead>Адрес</TableHead>
                          <TableHead>Сума</TableHead>
                          <TableHead>Плащане</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead>Дата</TableHead>
                          <TableHead>Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.customer_name || '-'}</TableCell>
                            <TableCell>{order.customer_email || '-'}</TableCell>
                            <TableCell>{order.customer_phone || '-'}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {order.shipping_city}, {order.shipping_address}
                            </TableCell>
                            <TableCell>{Number(order.total_amount).toFixed(2)} {order.currency}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {order.payment_method === 'cod' ? 'Наложен платеж' : 'Карта'}
                              </Badge>
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
              <DialogDescription>
                {selectedOrder && new Date(selectedOrder.created_at).toLocaleString('bg-BG')}
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
                  <div className="text-sm">
                    <p>{selectedOrder.shipping_city}</p>
                    <p>{selectedOrder.shipping_address}</p>
                  </div>
                </div>

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
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Обща сума</p>
                    <p className="text-2xl font-bold">
                      {Number(selectedOrder.total_amount).toFixed(2)} {selectedOrder.currency}
                    </p>
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
