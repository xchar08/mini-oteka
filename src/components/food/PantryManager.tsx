'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PantryItem } from '@/types';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';

export function PantryManager() {
  const { user } = useAuthContext();
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    unit: '',
    expirationDate: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'pantryItems'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        expirationDate: doc.data().expirationDate?.toDate(),
      })) as PantryItem[];
      
      setPantryItems(items);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const itemData = {
        ...formData,
        userId: user.uid,
        expirationDate: formData.expirationDate ? new Date(formData.expirationDate) : null,
        updatedAt: new Date(),
      };

      if (editingItem) {
        await updateDoc(doc(db, 'pantryItems', editingItem.id), itemData);
        setEditingItem(null);
      } else {
        await addDoc(collection(db, 'pantryItems'), {
          ...itemData,
          createdAt: new Date(),
        });
        setShowAddForm(false);
      }

      setFormData({
        name: '',
        category: '',
        quantity: 0,
        unit: '',
        expirationDate: '',
      });
    } catch (error) {
      console.error('Error saving pantry item:', error);
    }
    setLoading(false);
  };

  const handleEdit = (item: PantryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      expirationDate: item.expirationDate ? item.expirationDate.toISOString().split('T')[0] : '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await deleteDoc(doc(db, 'pantryItems', itemId));
    } catch (error) {
      console.error('Error deleting pantry item:', error);
    }
  };

  const categories = [...new Set(pantryItems.map(item => item.category))].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <Package className="w-6 h-6 mr-2" />
          Pantry Management
        </h2>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingItem ? 'Edit' : 'Add'} Pantry Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Item Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="e.g., Proteins, Vegetables, Grains"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Quantity</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Unit</label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    placeholder="e.g., kg, lbs, pieces, cans"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Expiration Date (Optional)</label>
                  <Input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({...formData, expirationDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingItem(null);
                    setFormData({
                      name: '',
                      category: '',
                      quantity: 0,
                      unit: '',
                      expirationDate: '',
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {pantryItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">Your pantry is empty. Add some items to get started!</p>
            <Button onClick={() => setShowAddForm(true)}>Add Your First Item</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {categories.map(category => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="capitalize">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pantryItems
                    .filter(item => item.category === category)
                    .map(item => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{item.name}</h3>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(item)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>{item.quantity} {item.unit}</p>
                          {item.expirationDate && (
                            <p className={`mt-1 ${
                              item.expirationDate < new Date() 
                                ? 'text-red-600' 
                                : item.expirationDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                ? 'text-yellow-600'
                                : 'text-gray-600'
                            }`}>
                              Expires: {item.expirationDate.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
