'use client';

import React, { useState, useEffect } from 'react';
import { PecsBoard, CardUsageStats } from '../types';
import { BarChart3, TrendingUp, Clock, Award, Calendar } from 'lucide-react';

interface AnalyticsProps {
  boards: PecsBoard[];
}

export default function Analytics({ boards }: AnalyticsProps) {
  const [selectedBoard, setSelectedBoard] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  const getAnalytics = () => {
    const filteredBoards = selectedBoard === 'all' 
      ? boards 
      : boards.filter(b => b.id === selectedBoard);

    const allCards = filteredBoards.flatMap(b => b.cards);
    const totalClicks = allCards.reduce((sum, card) => sum + (card.usageCount || 0), 0);
    const uniqueCards = allCards.length;

    // Most used cards
    const cardStats: CardUsageStats[] = allCards
      .filter(card => card.usageCount && card.usageCount > 0)
      .map(card => ({
        cardId: card.id,
        label: card.label,
        usageCount: card.usageCount || 0,
        lastUsed: card.lastUsed || 0,
        category: card.category
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    // Usage by category
    const usageByCategory: Record<string, number> = {};
    allCards.forEach(card => {
      const category = card.category || 'other';
      usageByCategory[category] = (usageByCategory[category] || 0) + (card.usageCount || 0);
    });

    // Recent activity (last 7 days)
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentCards = allCards.filter(card => 
      card.lastUsed && card.lastUsed > weekAgo
    );

    return {
      totalClicks,
      uniqueCards,
      mostUsedCards: cardStats,
      usageByCategory,
      recentActivity: recentCards.length,
      totalBoards: filteredBoards.length
    };
  };

  const analytics = getAnalytics();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your communication progress</p>
        </div>
        
        <div className="flex gap-3">
          <select
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Boards</option>
            {boards.map(board => (
              <option key={board.id} value={board.id}>{board.title}</option>
            ))}
          </select>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Clicks</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{analytics.totalClicks}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unique Cards</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{analytics.uniqueCards}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recent Activity</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{analytics.recentActivity}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Boards</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{analytics.totalBoards}</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Most Used Cards */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5" />
          Most Used Cards
        </h2>
        
        {analytics.mostUsedCards.length > 0 ? (
          <div className="space-y-3">
            {analytics.mostUsedCards.map((card, index) => (
              <div key={card.cardId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{card.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{card.category || 'other'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">{card.usageCount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">clicks</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No usage data yet. Start using your boards!</p>
          </div>
        )}
      </div>

      {/* Usage by Category */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Usage by Category</h2>
        
        {Object.keys(analytics.usageByCategory).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(analytics.usageByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => {
                const total = Object.values(analytics.usageByCategory).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
                
                return (
                  <div key={category}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{category}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-center py-4 text-gray-500 dark:text-gray-400">No category data available</p>
        )}
      </div>
    </div>
  );
}
