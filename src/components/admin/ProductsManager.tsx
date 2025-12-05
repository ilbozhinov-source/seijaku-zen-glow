import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Pencil, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { DbProduct, DbProductVariant } from '@/lib/products';

interface ProductWithVariants extends DbProduct {
  product_variants: DbProductVariant[];
}

const ProductsManager = () => {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<ProductWithVariants | null>(null);
  const [editingVariant, setEditingVariant] = useState<DbProductVariant | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [isNewVariant, setIsNewVariant] = useState(false);

  // Form states
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    handle: '',
    image_url: '',
    image_alt: ''
  });

  const [variantForm, setVariantForm] = useState({
    title: '',
    price: '',
    currency: 'BGN',
    available_for_sale: true,
    sort_order: 0
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Грешка при зареждане на продуктите');
      console.error(error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const openNewProductDialog = () => {
    setProductForm({ title: '', description: '', handle: '', image_url: '', image_alt: '' });
    setIsNewProduct(true);
    setEditingProduct(null);
    setIsProductDialogOpen(true);
  };

  const openEditProductDialog = (product: ProductWithVariants) => {
    setProductForm({
      title: product.title,
      description: product.description || '',
      handle: product.handle,
      image_url: product.image_url || '',
      image_alt: product.image_alt || ''
    });
    setIsNewProduct(false);
    setEditingProduct(product);
    setIsProductDialogOpen(true);
  };

  const openNewVariantDialog = (product: ProductWithVariants) => {
    setVariantForm({ title: '', price: '', currency: 'BGN', available_for_sale: true, sort_order: (product.product_variants?.length || 0) + 1 });
    setIsNewVariant(true);
    setEditingProduct(product);
    setEditingVariant(null);
    setIsVariantDialogOpen(true);
  };

  const openEditVariantDialog = (product: ProductWithVariants, variant: DbProductVariant) => {
    setVariantForm({
      title: variant.title,
      price: variant.price.toString(),
      currency: variant.currency,
      available_for_sale: variant.available_for_sale,
      sort_order: variant.sort_order
    });
    setIsNewVariant(false);
    setEditingProduct(product);
    setEditingVariant(variant);
    setIsVariantDialogOpen(true);
  };

  const saveProduct = async () => {
    if (!productForm.title || !productForm.handle) {
      toast.error('Заглавието и handle са задължителни');
      return;
    }

    if (isNewProduct) {
      const { error } = await supabase
        .from('products')
        .insert({
          title: productForm.title,
          description: productForm.description || null,
          handle: productForm.handle,
          image_url: productForm.image_url || null,
          image_alt: productForm.image_alt || null
        });

      if (error) {
        toast.error('Грешка при създаване на продукт');
        console.error(error);
        return;
      }
      toast.success('Продуктът е създаден');
    } else if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update({
          title: productForm.title,
          description: productForm.description || null,
          handle: productForm.handle,
          image_url: productForm.image_url || null,
          image_alt: productForm.image_alt || null
        })
        .eq('id', editingProduct.id);

      if (error) {
        toast.error('Грешка при обновяване на продукт');
        console.error(error);
        return;
      }
      toast.success('Продуктът е обновен');
    }

    setIsProductDialogOpen(false);
    fetchProducts();
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете този продукт?')) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      toast.error('Грешка при изтриване на продукт');
      console.error(error);
      return;
    }

    toast.success('Продуктът е изтрит');
    fetchProducts();
  };

  const saveVariant = async () => {
    if (!variantForm.title || !variantForm.price || !editingProduct) {
      toast.error('Заглавието и цената са задължителни');
      return;
    }

    const price = parseFloat(variantForm.price);
    if (isNaN(price) || price < 0) {
      toast.error('Невалидна цена');
      return;
    }

    if (isNewVariant) {
      const { error } = await supabase
        .from('product_variants')
        .insert({
          product_id: editingProduct.id,
          title: variantForm.title,
          price: price,
          currency: variantForm.currency,
          available_for_sale: variantForm.available_for_sale,
          sort_order: variantForm.sort_order
        });

      if (error) {
        toast.error('Грешка при създаване на вариант');
        console.error(error);
        return;
      }
      toast.success('Вариантът е създаден');
    } else if (editingVariant) {
      const { error } = await supabase
        .from('product_variants')
        .update({
          title: variantForm.title,
          price: price,
          currency: variantForm.currency,
          available_for_sale: variantForm.available_for_sale,
          sort_order: variantForm.sort_order
        })
        .eq('id', editingVariant.id);

      if (error) {
        toast.error('Грешка при обновяване на вариант');
        console.error(error);
        return;
      }
      toast.success('Вариантът е обновен');
    }

    setIsVariantDialogOpen(false);
    fetchProducts();
  };

  const deleteVariant = async (variantId: string) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете този вариант?')) return;

    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', variantId);

    if (error) {
      toast.error('Грешка при изтриване на вариант');
      console.error(error);
      return;
    }

    toast.success('Вариантът е изтрит');
    fetchProducts();
  };

  const toggleVariantAvailability = async (variant: DbProductVariant) => {
    const { error } = await supabase
      .from('product_variants')
      .update({ available_for_sale: !variant.available_for_sale })
      .eq('id', variant.id);

    if (error) {
      toast.error('Грешка при обновяване');
      return;
    }

    fetchProducts();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card className="border-primary/20 shadow-zen">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Продукти
            </CardTitle>
            <CardDescription>Управление на продукти и варианти</CardDescription>
          </div>
          <Button onClick={openNewProductDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Нов продукт
          </Button>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Няма продукти</p>
          ) : (
            <div className="space-y-6">
              {products.map((product) => (
                <Card key={product.id} className="border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{product.title}</CardTitle>
                        <CardDescription>{product.handle}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditProductDialog(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteProduct(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Варианти</h4>
                        <Button variant="outline" size="sm" onClick={() => openNewVariantDialog(product)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Добави
                        </Button>
                      </div>
                      {product.product_variants && product.product_variants.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Размер</TableHead>
                              <TableHead>Цена</TableHead>
                              <TableHead>Наличен</TableHead>
                              <TableHead className="text-right">Действия</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {product.product_variants
                              .sort((a, b) => a.sort_order - b.sort_order)
                              .map((variant) => (
                                <TableRow key={variant.id}>
                                  <TableCell className="font-medium">{variant.title}</TableCell>
                                  <TableCell>{Number(variant.price).toFixed(2)} {variant.currency}</TableCell>
                                  <TableCell>
                                    <Switch
                                      checked={variant.available_for_sale}
                                      onCheckedChange={() => toggleVariantAvailability(variant)}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button variant="ghost" size="sm" onClick={() => openEditVariantDialog(product, variant)}>
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => deleteVariant(variant.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground">Няма варианти</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isNewProduct ? 'Нов продукт' : 'Редактиране на продукт'}</DialogTitle>
            <DialogDescription>
              {isNewProduct ? 'Добавете нов продукт' : 'Редактирайте информацията за продукта'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Заглавие *</Label>
              <Input
                id="title"
                value={productForm.title}
                onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="handle">Handle (URL) *</Label>
              <Input
                id="handle"
                value={productForm.handle}
                onChange={(e) => setProductForm({ ...productForm, handle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>Отказ</Button>
            <Button onClick={saveProduct}>Запази</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variant Dialog */}
      <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isNewVariant ? 'Нов вариант' : 'Редактиране на вариант'}</DialogTitle>
            <DialogDescription>
              {isNewVariant ? 'Добавете нов вариант към продукта' : 'Редактирайте информацията за варианта'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="variant-title">Размер/Заглавие *</Label>
              <Input
                id="variant-title"
                value={variantForm.title}
                onChange={(e) => setVariantForm({ ...variantForm, title: e.target.value })}
                placeholder="напр. 30g, 50g, 100g"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variant-price">Цена *</Label>
              <Input
                id="variant-price"
                type="number"
                step="0.01"
                value={variantForm.price}
                onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variant-order">Подредба</Label>
              <Input
                id="variant-order"
                type="number"
                value={variantForm.sort_order}
                onChange={(e) => setVariantForm({ ...variantForm, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="variant-available"
                checked={variantForm.available_for_sale}
                onCheckedChange={(checked) => setVariantForm({ ...variantForm, available_for_sale: checked })}
              />
              <Label htmlFor="variant-available">Наличен за продажба</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVariantDialogOpen(false)}>Отказ</Button>
            <Button onClick={saveVariant}>Запази</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductsManager;
