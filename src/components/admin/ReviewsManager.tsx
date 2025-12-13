import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Check, X, Trash2, Star, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Review {
  id: string;
  name: string;
  email: string;
  occupation: string | null;
  rating: number;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-700 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-700 border-red-500/30',
};

const statusLabels: Record<string, string> = {
  pending: 'Изчакващ',
  approved: 'Одобрен',
  rejected: 'Отхвърлен',
};

const ReviewsManager = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Грешка при зареждане на отзивите');
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  };

  const updateReviewStatus = async (reviewId: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('reviews')
      .update({ status: newStatus })
      .eq('id', reviewId);

    if (error) {
      toast.error('Грешка при обновяване на статуса');
    } else {
      toast.success(`Отзивът е ${newStatus === 'approved' ? 'одобрен' : 'отхвърлен'}`);
      fetchReviews();
    }
  };

  const deleteReview = async (reviewId: string) => {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      toast.error('Грешка при изтриване на отзива');
    } else {
      toast.success('Отзивът е изтрит');
      fetchReviews();
    }
  };

  const filteredReviews = reviews.filter(review => 
    statusFilter === 'all' || review.status === statusFilter
  );

  const pendingCount = reviews.filter(r => r.status === 'pending').length;

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-zen">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Управление на отзиви</CardTitle>
              <CardDescription>
                Преглед и модерация на клиентски отзиви
                {pendingCount > 0 && (
                  <Badge className="ml-2 bg-yellow-500/20 text-yellow-700 border-yellow-500/30">
                    {pendingCount} изчакващи
                  </Badge>
                )}
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Всички" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички</SelectItem>
                <SelectItem value="pending">Изчакващи</SelectItem>
                <SelectItem value="approved">Одобрени</SelectItem>
                <SelectItem value="rejected">Отхвърлени</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Няма отзиви</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Име</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Оценка</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">
                        <div>
                          {review.name}
                          {review.occupation && (
                            <div className="text-xs text-muted-foreground">{review.occupation}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{review.email}</TableCell>
                      <TableCell>
                        <StarRating rating={review.rating} />
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[review.status]}>
                          {statusLabels[review.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString('bg-BG')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedReview(review)}
                            title="Преглед"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {review.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600 hover:text-green-700 hover:bg-green-100"
                                onClick={() => updateReviewStatus(review.id, 'approved')}
                                title="Одобри"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-700 hover:bg-red-100"
                                onClick={() => updateReviewStatus(review.id, 'rejected')}
                                title="Отхвърли"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {review.status !== 'pending' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100"
                              onClick={() => updateReviewStatus(review.id, review.status === 'approved' ? 'rejected' : 'approved')}
                              title={review.status === 'approved' ? 'Отхвърли' : 'Одобри'}
                            >
                              {review.status === 'approved' ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Изтриване на отзив</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Сигурни ли сте, че искате да изтриете този отзив? Това действие е необратимо.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отказ</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => deleteReview(review.id)}
                                >
                                  Изтрий
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

      {/* Review Details Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Преглед на отзив</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl font-semibold">
                  {selectedReview.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{selectedReview.name}</p>
                  {selectedReview.occupation && (
                    <p className="text-sm text-muted-foreground">{selectedReview.occupation}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span>{selectedReview.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Оценка:</span>
                  <StarRating rating={selectedReview.rating} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Статус:</span>
                  <Badge className={statusColors[selectedReview.status]}>
                    {statusLabels[selectedReview.status]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Дата:</span>
                  <span>{new Date(selectedReview.created_at).toLocaleDateString('bg-BG', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Отзив:</p>
                <p className="bg-muted/50 p-4 rounded-lg italic">"{selectedReview.text}"</p>
              </div>

              <div className="flex gap-2 pt-4">
                {selectedReview.status !== 'approved' && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      updateReviewStatus(selectedReview.id, 'approved');
                      setSelectedReview(null);
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Одобри
                  </Button>
                )}
                {selectedReview.status !== 'rejected' && (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      updateReviewStatus(selectedReview.id, 'rejected');
                      setSelectedReview(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Отхвърли
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewsManager;
