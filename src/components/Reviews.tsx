import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Send } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Review {
  id: string;
  name: string;
  occupation: string | null;
  rating: number;
  text: string;
}

const Reviews = () => {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    occupation: '',
    rating: 5,
    text: ''
  });

  // Default reviews for display when no approved reviews exist
  const defaultReviews = [
    {
      id: 'default-1',
      name: t('reviews.review1Name'),
      occupation: t('reviews.review1Occupation'),
      rating: 5,
      text: t('reviews.review1Text'),
    },
    {
      id: 'default-2',
      name: t('reviews.review2Name'),
      occupation: t('reviews.review2Occupation'),
      rating: 5,
      text: t('reviews.review2Text'),
    },
    {
      id: 'default-3',
      name: t('reviews.review3Name'),
      occupation: t('reviews.review3Occupation'),
      rating: 5,
      text: t('reviews.review3Text'),
    }
  ];

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, name, occupation, rating, text')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.text.trim()) {
      toast({
        title: t('reviews.errorTitle'),
        description: t('reviews.errorRequired'),
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        occupation: formData.occupation.trim() || null,
        rating: formData.rating,
        text: formData.text.trim()
      };

      const { error } = await supabase
        .from('reviews')
        .insert(reviewData);

      if (error) throw error;

      // Send notification email (fire and forget - don't block on failure)
      supabase.functions.invoke('send-review-notification', {
        body: reviewData
      }).catch(err => console.error('Failed to send review notification:', err));

      toast({
        title: t('reviews.successTitle'),
        description: t('reviews.successMessage'),
      });

      setFormData({
        name: '',
        email: '',
        occupation: '',
        rating: 5,
        text: ''
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: t('reviews.errorTitle'),
        description: t('reviews.errorSubmit'),
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const displayReviews = reviews.length > 0 ? reviews : defaultReviews;

  const StarRating = ({ rating, interactive = false, onRatingChange }: { 
    rating: number; 
    interactive?: boolean; 
    onRatingChange?: (rating: number) => void 
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'fill-primary text-primary' : 'text-muted-foreground'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={() => interactive && onRatingChange?.(star)}
        />
      ))}
    </div>
  );

  return (
    <section className="py-20 md:py-32 bg-gradient-soft">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            {t('reviews.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('reviews.subtitle')}
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {displayReviews.map((review) => (
            <Card key={review.id} className="shadow-zen hover:shadow-soft zen-transition border-primary/10">
              <CardContent className="pt-6 space-y-4">
                <StarRating rating={review.rating} />
                <p className="text-muted-foreground leading-relaxed italic">
                  "{review.text}"
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl">
                    {review.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{review.name}</p>
                    {review.occupation && (
                      <p className="text-sm text-muted-foreground">{review.occupation}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Badge Section */}
        <div className="mb-16 max-w-4xl mx-auto text-center">
          <div className="inline-flex flex-wrap justify-center gap-8 items-center p-8 bg-card rounded-2xl shadow-soft border border-border">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">4.9/5</div>
              <p className="text-sm text-muted-foreground">{t('reviews.averageRating')}</p>
            </div>
            <div className="h-12 w-px bg-border"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">500+</div>
              <p className="text-sm text-muted-foreground">{t('reviews.satisfiedClients')}</p>
            </div>
            <div className="h-12 w-px bg-border"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">98%</div>
              <p className="text-sm text-muted-foreground">{t('reviews.recommend')}</p>
            </div>
          </div>
        </div>

        {/* Submit Review Form */}
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-zen border-primary/10">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
                {t('reviews.formTitle')}
              </h2>
              <p className="text-muted-foreground text-center mb-6">
                {t('reviews.formSubtitle')}
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('reviews.nameLabel')} *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('reviews.namePlaceholder')}
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('reviews.emailLabel')} *
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t('reviews.emailPlaceholder')}
                      maxLength={255}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t('reviews.occupationLabel')}
                  </label>
                  <Input
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    placeholder={t('reviews.occupationPlaceholder')}
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('reviews.ratingLabel')} *
                  </label>
                  <StarRating 
                    rating={formData.rating} 
                    interactive 
                    onRatingChange={(rating) => setFormData({ ...formData, rating })} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t('reviews.reviewLabel')} *
                  </label>
                  <Textarea
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    placeholder={t('reviews.reviewPlaceholder')}
                    rows={4}
                    maxLength={1000}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitting}
                >
                  {submitting ? (
                    t('reviews.submitting')
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t('reviews.submitButton')}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Reviews;
