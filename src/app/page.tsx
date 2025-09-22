'use client';

import { useState } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { LoginForm } from '@/components/auth/LoginForm';
import { FamilyMemberList } from '@/components/family/FamilyMemberList';
import { PantryManager } from '@/components/food/PantryManager';
import { MealPlanGenerator } from '@/components/meals/MealPlanGenerator';
import { Button } from '@/components/ui/button';
import { Users, Package, ChefHat, LogOut } from 'lucide-react';

export default function Home() {
  const { user, loading, logout } = useAuthContext();
  const [activeTab, setActiveTab] = useState('family');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const tabs = [
    { id: 'family', label: 'Family Members', icon: Users },
    { id: 'pantry', label: 'Pantry', icon: Package },
    { id: 'meals', label: 'Meal Planning', icon: ChefHat },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Family Health Tracker
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.displayName || user.email}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="tab-content">
          {activeTab === 'family' && <FamilyMemberList />}
          {activeTab === 'pantry' && <PantryManager />}
          {activeTab === 'meals' && <MealPlanGenerator />}
        </div>
      </div>
    </div>
  );
}
