'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, X, Download, TrendingUp, Calendar, Sparkles, Trophy, Undo2, Tag, Palette, Moon, Sun } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

interface Habit {
  id: string;
  name: string;
  description: string;
  completions: Record<string, boolean>;
  streak: number;
  createdAt: string;
  category?: string;
}

interface MoodEntry {
  color: number;
  diary: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

interface UserSettings {
  theme: 'light' | 'dark';
  accentColor: string;
  eveningSummary: boolean;
}

const CATEGORIES = ['Health', 'Productivity', 'Mindfulness', 'Social', 'Learning', 'Other'];
const ACCENT_COLORS = [
  { name: 'Purple', from: 'from-indigo-600', to: 'to-purple-600', border: 'border-purple-500', bg: 'bg-purple-500' },
  { name: 'Teal', from: 'from-teal-600', to: 'to-cyan-600', border: 'border-teal-500', bg: 'bg-teal-500' },
  { name: 'Orange', from: 'from-orange-600', to: 'to-red-600', border: 'border-orange-500', bg: 'bg-orange-500' },
  { name: 'Green', from: 'from-green-600', to: 'to-emerald-600', border: 'border-green-500', bg: 'bg-green-500' },
  { name: 'Pink', from: 'from-pink-600', to: 'to-rose-600', border: 'border-pink-500', bg: 'bg-pink-500' },
];

export default function Home() {
  const { user, isLoaded } = useUser();
  const [currentView, setCurrentView] = useState('dashboard');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [moodData, setMoodData] = useState<Record<string, MoodEntry>>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', description: '', category: 'Other' });
  const [colorGradient] = useState([
    '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe',
    '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7', '#fffbeb'
  ]);
  const [diaryEntry, setDiaryEntry] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [deletedHabit, setDeletedHabit] = useState<Habit | null>(null);
  const [settings, setSettings] = useState<UserSettings>({ theme: 'light', accentColor: 'Purple', eveningSummary: true });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const diaryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      loadData();
      checkEveningSummary();
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (moodData[selectedDate]) {
      setDiaryEntry(moodData[selectedDate].diary || '');
    } else {
      setDiaryEntry('');
    }
  }, [selectedDate, moodData]);

  useEffect(() => {
    // Apply theme
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const loadData = () => {
    if (!user) return;
    
    try {
      const habitKey = `habits-${user.id}`;
      const moodKey = `mood-${user.id}`;
      const achievementsKey = `achievements-${user.id}`;
      const settingsKey = `settings-${user.id}`;
      
      const storedHabits = localStorage.getItem(habitKey);
      const storedMood = localStorage.getItem(moodKey);
      const storedAchievements = localStorage.getItem(achievementsKey);
      const storedSettings = localStorage.getItem(settingsKey);
      
      if (storedHabits) setHabits(JSON.parse(storedHabits));
      if (storedMood) setMoodData(JSON.parse(storedMood));
      if (storedAchievements) setAchievements(JSON.parse(storedAchievements));
      if (storedSettings) setSettings(JSON.parse(storedSettings));
    } catch (error) {
      console.log('Error loading data:', error);
    }
  };

  const checkEveningSummary = () => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 20 && settings.eveningSummary) {
      const today = now.toISOString().split('T')[0];
      const lastShown = localStorage.getItem(`eveningSummary-${user?.id}-${today}`);
      
      if (!lastShown) {
        const stats = getTodayStats();
        showToastMessage(`You completed ${stats.completed}/${stats.total} habits today! ${stats.percentage >= 80 ? '🎉' : '💪'}`);
        localStorage.setItem(`eveningSummary-${user?.id}-${today}`, 'shown');
      }
    }
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const saveHabits = (updatedHabits: Habit[]) => {
    if (!user) return;
    setHabits(updatedHabits);
    try {
      localStorage.setItem(`habits-${user.id}`, JSON.stringify(updatedHabits));
    } catch (error) {
      console.error('Error saving habits:', error);
    }
  };

  const saveMoodData = (updatedMoodData: Record<string, MoodEntry>) => {
    if (!user) return;
    setMoodData(updatedMoodData);
    try {
      localStorage.setItem(`mood-${user.id}`, JSON.stringify(updatedMoodData));
    } catch (error) {
      console.error('Error saving mood data:', error);
    }
  };

  const saveAchievements = (updatedAchievements: Achievement[]) => {
    if (!user) return;
    setAchievements(updatedAchievements);
    try {
      localStorage.setItem(`achievements-${user.id}`, JSON.stringify(updatedAchievements));
    } catch (error) {
      console.error('Error saving achievements:', error);
    }
  };

  const saveSettings = (updatedSettings: UserSettings) => {
    if (!user) return;
    setSettings(updatedSettings);
    try {
      localStorage.setItem(`settings-${user.id}`, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const checkAchievements = (updatedHabits: Habit[]) => {
    const newAchievements: Achievement[] = [];
    
    // Check 3-day streak
    const hasThreeDayStreak = updatedHabits.some(h => h.streak >= 3);
    if (hasThreeDayStreak && !achievements.find(a => a.id === '3-day-streak')) {
      newAchievements.push({
        id: '3-day-streak',
        title: '3-Day Warrior',
        description: 'Maintained a 3-day streak!',
        icon: '🔥',
        unlockedAt: new Date().toISOString()
      });
    }
    
    // Check 7-day streak
    const hasSevenDayStreak = updatedHabits.some(h => h.streak >= 7);
    if (hasSevenDayStreak && !achievements.find(a => a.id === '7-day-streak')) {
      newAchievements.push({
        id: '7-day-streak',
        title: 'Week Champion',
        description: 'Maintained a 7-day streak!',
        icon: '🏆',
        unlockedAt: new Date().toISOString()
      });
    }
    
    // Check perfect day
    const stats = getTodayStats();
    if (stats.percentage === 100 && stats.total > 0 && !achievements.find(a => a.id === `perfect-${selectedDate}`)) {
      newAchievements.push({
        id: `perfect-${selectedDate}`,
        title: 'Perfect Day',
        description: 'Completed all habits today!',
        icon: '⭐',
        unlockedAt: new Date().toISOString()
      });
      
      // Show confetti
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    if (newAchievements.length > 0) {
      const allAchievements = [...achievements, ...newAchievements];
      saveAchievements(allAchievements);
      showToastMessage(`🎉 Achievement unlocked: ${newAchievements[0].title}!`);
    }
  };

  const addHabit = () => {
    if (newHabit.name.trim()) {
      const habit: Habit = {
        id: Date.now().toString(),
        name: newHabit.name,
        description: newHabit.description,
        completions: {},
        streak: 0,
        createdAt: new Date().toISOString(),
        category: newHabit.category
      };
      saveHabits([...habits, habit]);
      setNewHabit({ name: '', description: '', category: 'Other' });
      setShowAddHabit(false);
    }
  };

  const toggleHabitCompletion = (habitId: string) => {
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const completions = { ...habit.completions };
        completions[selectedDate] = !completions[selectedDate];
        
        let streak = 0;
        let checkDate = new Date(selectedDate);
        while (true) {
          const dateStr = checkDate.toISOString().split('T')[0];
          if (completions[dateStr]) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        
        return { ...habit, completions, streak };
      }
      return habit;
    });
    saveHabits(updatedHabits);
    checkAchievements(updatedHabits);
  };

  const deleteHabit = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      setDeletedHabit(habit);
      saveHabits(habits.filter(h => h.id !== habitId));
      showToastMessage('Habit deleted. Click undo to restore.');
      setTimeout(() => setDeletedHabit(null), 10000);
    }
  };

  const undoDelete = () => {
    if (deletedHabit) {
      saveHabits([...habits, deletedHabit]);
      setDeletedHabit(null);
      showToastMessage('Habit restored!');
    }
  };

  const setMood = (colorIndex: number) => {
    const updatedMoodData = { ...moodData };
    if (!updatedMoodData[selectedDate]) {
      updatedMoodData[selectedDate] = { color: colorIndex, diary: diaryEntry };
    } else {
      updatedMoodData[selectedDate].color = colorIndex;
      updatedMoodData[selectedDate].diary = diaryEntry;
    }
    saveMoodData(updatedMoodData);
  };

  const updateDiary = (text: string) => {
    setDiaryEntry(text);
    
    // Auto-save after 2 seconds of no typing
    if (diaryTimeoutRef.current) {
      clearTimeout(diaryTimeoutRef.current);
    }
    
    diaryTimeoutRef.current = setTimeout(() => {
      const updatedMoodData = { ...moodData };
      if (!updatedMoodData[selectedDate]) {
        updatedMoodData[selectedDate] = { color: 0, diary: text };
      } else {
        updatedMoodData[selectedDate].diary = text;
      }
      saveMoodData(updatedMoodData);
    }, 2000);
  };

  const getTodayStats = () => {
    const todayCompletions = habits.filter(h => h.completions[selectedDate]).length;
    const totalHabits = habits.length;
    const percentage = totalHabits > 0 ? Math.round((todayCompletions / totalHabits) * 100) : 0;
    return { completed: todayCompletions, total: totalHabits, percentage };
  };

  const getDailySummary = () => {
    const stats = getTodayStats();
    
    if (stats.percentage === 100) {
      return "🎉 Perfect day! All habits completed!";
    } else if (stats.percentage >= 75) {
      return "💪 Great job! You're doing amazing!";
    } else if (stats.percentage >= 50) {
      return "👍 Good progress! Keep it up!";
    } else if (stats.completed > 0) {
      return "🌱 Every step counts! Keep going!";
    } else {
      return "🌟 New day, new opportunities!";
    }
  };

  const getFilteredHabits = () => {
    if (!selectedCategory) return habits;
    return habits.filter(h => h.category === selectedCategory);
  };

  const exportToPDF = () => {
    const stats = getTodayStats();
    const summary = getDailySummary();
    
    let pdfContent = `HABIT TRACKER REPORT\n\n`;
    pdfContent += `Date: ${selectedDate}\n\n`;
    pdfContent += `SUMMARY\n`;
    pdfContent += `Completed: ${stats.completed}/${stats.total} (${stats.percentage}%)\n`;
    pdfContent += `${summary}\n\n`;
    pdfContent += `HABITS\n`;
    
    habits.forEach(habit => {
      const status = habit.completions[selectedDate] ? '✓' : '✗';
      pdfContent += `${status} ${habit.name} (Streak: ${habit.streak}, Category: ${habit.category})\n`;
    });
    
    if (moodData[selectedDate]) {
      pdfContent += `\nMOOD\n`;
      pdfContent += `Color Index: ${moodData[selectedDate].color}\n`;
      if (moodData[selectedDate].diary) {
        pdfContent += `Diary: ${moodData[selectedDate].diary}\n`;
      }
    }
    
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-report-${selectedDate}.txt`;
    a.click();
  };

  const currentAccent = ACCENT_COLORS.find(c => c.name === settings.accentColor) || ACCENT_COLORS[0];

  const DashboardView = () => {
    const stats = getTodayStats();
    const currentMood = moodData[selectedDate];
    const filteredHabits = getFilteredHabits();

    return (
      <div className="space-y-6">
        {/* Date Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            <Calendar size={18} className={`${currentAccent.bg.replace('bg-', 'text-')}`} />
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-3 border-2 border-indigo-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            <Tag size={18} className={`${currentAccent.bg.replace('bg-', 'text-')}`} />
            Filter by Category
          </label>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                !selectedCategory
                  ? `bg-gradient-to-r ${currentAccent.from} ${currentAccent.to} text-white shadow-md`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === cat
                    ? `bg-gradient-to-r ${currentAccent.from} ${currentAccent.to} text-white shadow-md`
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Summary Card */}
        <div className={`bg-gradient-to-br ${currentAccent.from} ${currentAccent.to} rounded-2xl shadow-lg p-8 text-white relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={24} />
              <h2 className="text-2xl font-bold">Daily Summary</h2>
            </div>
            <p className="text-6xl font-bold mb-3">{stats.percentage}%</p>
            <p className="text-xl mb-4">{getDailySummary()}</p>
            <div className="inline-block bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-sm font-medium">
              {stats.completed} of {stats.total} habits completed
            </div>
          </div>
        </div>

        {/* Habits List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Today's Habits {selectedCategory && `(${selectedCategory})`}</h3>
            <button
              onClick={() => setShowAddHabit(true)}
              className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${currentAccent.from} ${currentAccent.to} text-white rounded-xl hover:shadow-lg transition-all font-medium`}
            >
              <Plus size={20} /> Add Habit
            </button>
          </div>

          {filteredHabits.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block p-4 bg-indigo-50 dark:bg-gray-700 rounded-full mb-4">
                <Sparkles size={32} className={`${currentAccent.bg.replace('bg-', 'text-')}`} />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {selectedCategory ? `No habits in ${selectedCategory} category` : 'No habits yet. Add your first habit to get started!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHabits.map(habit => (
                <div key={habit.id} className="group flex items-center justify-between p-4 border-2 border-indigo-100 dark:border-gray-700 rounded-xl hover:border-indigo-300 dark:hover:border-gray-600 hover:bg-indigo-50/50 dark:hover:bg-gray-700/50 transition-all">
                  <div className="flex items-center gap-4 flex-1">
                    <button
                      onClick={() => toggleHabitCompletion(habit.id)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        habit.completions[selectedDate]
                          ? 'bg-gradient-to-br from-green-400 to-emerald-500 border-green-500 shadow-md scale-110'
                          : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:scale-105'
                      }`}
                    >
                      {habit.completions[selectedDate] && <Check size={18} className="text-white font-bold" />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 dark:text-white">{habit.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${currentAccent.from} ${currentAccent.to} text-white`}>
                          {habit.category}
                        </span>
                      </div>
                      {habit.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{habit.description}</p>}
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-sm font-bold text-orange-500">🔥 {habit.streak}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">day streak</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mood Journal */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">How was your day?</h3>
          
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">Select a color that represents your mood:</p>
            <div className="flex gap-2 flex-wrap">
              {colorGradient.map((color, index) => (
                <button
                  key={index}
                  onClick={() => setMood(index)}
                  className={`w-14 h-14 rounded-xl border-4 transition-all hover:scale-110 ${
                    currentMood?.color === index ? 'border-gray-800 dark:border-white scale-110 shadow-lg' : 'border-white dark:border-gray-700 shadow-md hover:shadow-lg'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Mood level ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="pt-6 border-t-2 border-indigo-100 dark:border-gray-700">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              📝 What made you smile today?
            </label>
            <textarea
              value={diaryEntry}
              onChange={(e) => updateDiary(e.target.value)}
              placeholder="Start writing... (auto-saves as you type)"
              className="w-full px-4 py-3 border-2 border-purple-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl h-32 resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {currentMood?.diary ? '✓ Auto-saved' : 'Type to start...'}
            </p>
          </div>
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={24} className="text-yellow-500" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Achievements</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {achievements.slice(-6).reverse().map(achievement => (
                <div key={achievement.id} className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-xl text-center">
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <p className="font-bold text-gray-800 dark:text-white text-sm">{achievement.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{achievement.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const AnalyticsView = () => {
    const [selectedDiaryDate, setSelectedDiaryDate] = useState<string | null>(null);
    const [analyticsWeekOffset, setAnalyticsWeekOffset] = useState(0);

    const get7DaysForOffset = (offset: number) => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i - (offset * 7));
        days.push(date.toISOString().split('T')[0]);
      }
      return days;
    };

    const last7Days = get7DaysForOffset(analyticsWeekOffset);
    
    const getWeekLabel = () => {
      if (analyticsWeekOffset === 0) return "This Week";
      if (analyticsWeekOffset === 1) return "Last Week";
      const startDate = new Date(last7Days[0]);
      const endDate = new Date(last7Days[6]);
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };

    // Streak Leaderboard
    const topStreaks = [...habits].sort((a, b) => b.streak - a.streak).slice(0, 5);
    
    return (
      <div className="space-y-6">
        {/* Week Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setAnalyticsWeekOffset(analyticsWeekOffset + 1)}
              className={`px-4 py-2 bg-gradient-to-r ${currentAccent.from} ${currentAccent.to} text-white rounded-lg hover:shadow-md font-medium transition-all`}
            >
              ← Previous Week
            </button>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-800 dark:text-white">{getWeekLabel()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(last7Days[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(last7Days[6]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => setAnalyticsWeekOffset(Math.max(0, analyticsWeekOffset - 1))}
              disabled={analyticsWeekOffset === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                analyticsWeekOffset === 0
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : `bg-gradient-to-r ${currentAccent.from} ${currentAccent.to} text-white hover:shadow-md`
              }`}
            >
              Next Week →
            </button>
          </div>
        </div>

        {/* Streak Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-6">
            <Trophy size={24} className="text-yellow-500" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Streak Leaderboard</h3>
          </div>
          {topStreaks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 font-medium">No habits to display</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topStreaks.map((habit, index) => (
                <div key={habit.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-xl hover:shadow-md transition-all">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                    'bg-gradient-to-br from-gray-400 to-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 dark:text-white">{habit.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{habit.category}</p>
                  </div>
                  <span className="text-orange-600 dark:text-orange-400 font-bold text-xl">🔥 {habit.streak}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={24} className={`${currentAccent.bg.replace('bg-', 'text-')}`} />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">7-Day Completion Rate</h3>
          </div>
          <div className="space-y-4">
            {last7Days.map(date => {
              const completions = habits.filter(h => h.completions[date]).length;
              const total = habits.length;
              const percentage = total > 0 ? (completions / total) * 100 : 0;
              
              return (
                <div key={date}>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span className="text-gray-700 dark:text-gray-300">{new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span className={`${currentAccent.bg.replace('bg-', 'text-')}`}>{completions}/{total}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r ${currentAccent.from} ${currentAccent.to} h-3 rounded-full transition-all duration-500 shadow-inner`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Mood Trend</h3>
          <div className="flex gap-2">
            {last7Days.map(date => {
              const mood = moodData[date];
              return (
                <div key={date} className="flex-1">
                  <div
                    className="w-full h-28 rounded-t-xl shadow-md hover:shadow-lg transition-all hover:scale-105"
                    style={{ backgroundColor: mood ? colorGradient[mood.color] : '#e5e7eb' }}
                  />
                  <p className="text-xs text-center mt-2 font-semibold text-gray-600 dark:text-gray-400">{new Date(date).getDate()}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Diary Entries</h3>
          {last7Days.filter(date => moodData[date]?.diary).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 font-medium">No diary entries for this week</p>
            </div>
          ) : (
            <div className="space-y-3">
              {last7Days
                .filter(date => moodData[date]?.diary)
                .reverse()
                .map(date => {
                  const entry = moodData[date];
                  const isExpanded = selectedDiaryDate === date;
                  
                  return (
                    <div key={date} className="border-2 border-purple-100 dark:border-purple-900 rounded-xl overflow-hidden hover:border-purple-300 dark:hover:border-purple-700 transition-all">
                      <button
                        onClick={() => setSelectedDiaryDate(isExpanded ? null : date)}
                        className="w-full flex items-center justify-between p-4 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-all text-left"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-10 h-10 rounded-lg shadow-md"
                            style={{ backgroundColor: colorGradient[entry.color] }}
                          />
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-white">
                              {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                            {entry.diary && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {entry.diary.length > 60 && !isExpanded ? `${entry.diary.substring(0, 60)}...` : 
                                 entry.diary.length <= 60 ? entry.diary : ''}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-purple-600 dark:text-purple-400 font-medium text-sm">
                          {isExpanded ? '▲ Hide' : '▼ Read'}
                        </div>
                      </button>
                      
                      {isExpanded && entry.diary && (
                        <div className="px-4 pb-4 pt-2 bg-purple-50/30 dark:bg-purple-900/20 border-t border-purple-100 dark:border-purple-900 animate-in slide-in-from-top-2 duration-200">
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {entry.diary}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className={`w-16 h-16 border-4 border-indigo-200 ${currentAccent.border} rounded-full animate-spin mx-auto mb-4`}></div>
          <div className="text-gray-600 dark:text-gray-400 font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl mt-12 p-4">
        <div className="rounded-3xl bg-white dark:bg-gray-800 p-12 shadow-2xl text-center border border-indigo-100 dark:border-gray-700">
          <div className={`inline-block p-4 bg-gradient-to-br ${currentAccent.from} ${currentAccent.to} rounded-3xl mb-6 shadow-lg`}>
            <span className="text-6xl">✨</span>
          </div>
          <h1 className={`mb-4 text-5xl font-bold bg-gradient-to-r ${currentAccent.from} ${currentAccent.to} bg-clip-text text-transparent`}>
            Welcome to Habit & Mood Tracker
          </h1>
          <p className="mb-8 text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Track your daily habits, log your mood, and see your progress over time. Build the life you want, one day at a time.
          </p>
          <div className="flex gap-4 justify-center">
            <a 
              href="/sign-up" 
              className={`rounded-xl bg-gradient-to-r ${currentAccent.from} ${currentAccent.to} px-8 py-4 text-white font-semibold hover:shadow-xl transition-all text-lg`}
            >
              Get Started Free
            </a>
            <a 
              href="/sign-in" 
              className={`rounded-xl border-2 ${currentAccent.border} px-8 py-4 font-semibold hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all text-lg ${currentAccent.bg.replace('bg-', 'text-')}`}
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                animation: `fall ${2 + Math.random() * 2}s linear forwards`,
                animationDelay: `${Math.random() * 0.5}s`
              }}
            >
              {['🎉', '✨', '🎊', '⭐', '💫'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className={`bg-gradient-to-r ${currentAccent.from} ${currentAccent.to} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-md`}>
            <span className="font-medium">{toastMessage}</span>
            {deletedHabit && (
              <button
                onClick={undoDelete}
                className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-all font-medium"
              >
                <Undo2 size={16} />
                Undo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-indigo-100 dark:border-gray-700 sticky top-[73px] z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`py-4 px-6 border-b-4 font-semibold transition-all ${
                currentView === 'dashboard'
                  ? `${currentAccent.border} ${currentAccent.bg.replace('bg-', 'text-')}`
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              className={`py-4 px-6 border-b-4 font-semibold transition-all ${
                currentView === 'analytics'
                  ? `${currentAccent.border} ${currentAccent.bg.replace('bg-', 'text-')}`
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={exportToPDF}
              className="py-4 px-6 border-b-4 border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 font-semibold flex items-center gap-2 transition-all"
            >
              <Download size={18} /> Export
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="py-4 px-6 border-b-4 border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 font-semibold flex items-center gap-2 transition-all ml-auto"
            >
              <Palette size={18} /> Settings
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'analytics' && <AnalyticsView />}
      </main>

      {/* Add Habit Modal */}
      {showAddHabit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-indigo-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
            <h3 className={`text-2xl font-bold mb-6 bg-gradient-to-r ${currentAccent.from} ${currentAccent.to} bg-clip-text text-transparent`}>Add New Habit</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Habit Name</label>
                <input
                  type="text"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  placeholder="e.g., Exercise, Read, Meditate"
                  className="w-full px-4 py-3 border-2 border-indigo-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description (Optional)</label>
                <input
                  type="text"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  placeholder="e.g., 30 minutes of cardio"
                  className="w-full px-4 py-3 border-2 border-indigo-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <select
                  value={newHabit.category}
                  onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-indigo-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => {
                    setShowAddHabit(false);
                    setNewHabit({ name: '', description: '', category: 'Other' });
                  }}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={addHabit}
                  className={`px-6 py-3 bg-gradient-to-r ${currentAccent.from} ${currentAccent.to} text-white rounded-xl hover:shadow-lg font-medium transition-all`}
                >
                  Add Habit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-indigo-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
            <h3 className={`text-2xl font-bold mb-6 bg-gradient-to-r ${currentAccent.from} ${currentAccent.to} bg-clip-text text-transparent`}>Settings</h3>
            <div className="space-y-6">
              {/* Theme Toggle */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Theme</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => saveSettings({ ...settings, theme: 'light' })}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                      settings.theme === 'light'
                        ? `${currentAccent.border} bg-gradient-to-r ${currentAccent.from} ${currentAccent.to} text-white`
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <Sun size={20} />
                    Light
                  </button>
                  <button
                    onClick={() => saveSettings({ ...settings, theme: 'dark' })}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                      settings.theme === 'dark'
                        ? `${currentAccent.border} bg-gradient-to-r ${currentAccent.from} ${currentAccent.to} text-white`
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <Moon size={20} />
                    Dark
                  </button>
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Accent Color</label>
                <div className="grid grid-cols-3 gap-3">
                  {ACCENT_COLORS.map(color => (
                    <button
                      key={color.name}
                      onClick={() => saveSettings({ ...settings, accentColor: color.name })}
                      className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                        settings.accentColor === color.name
                          ? `${color.border} bg-gradient-to-r ${color.from} ${color.to} text-white shadow-md`
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:text-white'
                      }`}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Evening Summary Toggle */}
              <div>
                <label className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Evening Summary Notification</span>
                  <button
                    onClick={() => saveSettings({ ...settings, eveningSummary: !settings.eveningSummary })}
                    className={`relative w-14 h-8 rounded-full transition-all ${
                      settings.eveningSummary ? `${currentAccent.bg}` : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      settings.eveningSummary ? 'translate-x-6' : ''
                    }`} />
                  </button>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Get a daily summary at 8 PM</p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-700">
                <button
                  onClick={() => setShowSettings(false)}
                  className={`px-6 py-3 bg-gradient-to-r ${currentAccent.from} ${currentAccent.to} text-white rounded-xl hover:shadow-lg font-medium transition-all`}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}