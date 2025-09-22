'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FamilyMember } from '@/types';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { FamilyMemberForm } from './FamilyMemberForm';
import { Pencil, Trash2, Plus } from 'lucide-react';

export function FamilyMemberList() {
  const { user } = useAuthContext();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'familyMembers'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as FamilyMember[];
      
      setMembers(membersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddMember = async (memberData: Omit<FamilyMember, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      await addDoc(collection(db, 'familyMembers'), {
        ...memberData,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding family member:', error);
    }
  };

  const handleUpdateMember = async (memberData: Omit<FamilyMember, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!editingMember) return;

    try {
      await updateDoc(doc(db, 'familyMembers', editingMember.id), {
        ...memberData,
        updatedAt: new Date(),
      });
      setEditingMember(null);
    } catch (error) {
      console.error('Error updating family member:', error);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to delete this family member?')) return;

    try {
      await deleteDoc(doc(db, 'familyMembers', memberId));
    } catch (error) {
      console.error('Error deleting family member:', error);
    }
  };

  if (loading) {
    return <div className="text-center">Loading family members...</div>;
  }

  if (showForm) {
    return (
      <FamilyMemberForm
        onSubmit={handleAddMember}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  if (editingMember) {
    return (
      <FamilyMemberForm
        onSubmit={handleUpdateMember}
        initialData={editingMember}
        onCancel={() => setEditingMember(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Family Members</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500 mb-4">No family members added yet.</p>
            <Button onClick={() => setShowForm(true)}>
              Add Your First Family Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {member.name}
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingMember(member)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteMember(member.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span>{member.age} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Height:</span>
                    <span>{member.height} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight:</span>
                    <span>{member.weight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Goal:</span>
                    <span className="capitalize">{member.goal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target Calories:</span>
                    <span className="font-medium">{member.targetCalories}</span>
                  </div>
                  {member.dietaryRestrictions && (
                    <div className="pt-2 border-t">
                      <span className="text-gray-600 text-xs">Restrictions:</span>
                      <p className="text-xs mt-1">{member.dietaryRestrictions}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
