
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
// Using type-only imports for better TypeScript compliance
import type { 
  Course, 
  Mission, 
  StudentProgress, 
  LeaderboardEntry, 
  UserRole,
  User,
  LearningMaterial
} from '../../server/src/schema';

// Current user - in real app this would come from authentication
const currentUser: User = {
  id: 1,
  username: 'student123',
  email: 'student@example.com',
  password_hash: '',
  full_name: 'Ahmad Pratama',
  role: 'student' as UserRole,
  created_at: new Date(),
  updated_at: new Date()
};

// Fallback data for when API returns empty results (since handlers are stubs)
const fallbackCourses: Course[] = [
  {
    id: 1,
    name: 'Total Quality Management (TQM)',
    description: 'Practical module covering TQM principles, implementation, and continuous improvement methodologies',
    lecturer_id: 2,
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  }
];

const fallbackMissions: Mission[] = [
  {
    id: 1,
    course_id: 1,
    title: '🎯 Pertemuan 1: Introduction to TQM',
    description: 'Understanding the fundamentals of Total Quality Management and its principles',
    meeting_number: 1,
    points_reward: 100,
    is_active: true,
    created_at: new Date('2024-01-20'),
    updated_at: new Date('2024-01-20')
  },
  {
    id: 2,
    course_id: 1,
    title: '📊 Pertemuan 2: Quality Planning & Control',
    description: 'Learn about quality planning processes and control mechanisms',
    meeting_number: 2,
    points_reward: 120,
    is_active: true,
    created_at: new Date('2024-01-27'),
    updated_at: new Date('2024-01-27')
  },
  {
    id: 3,
    course_id: 1,
    title: '🔄 Pertemuan 3: Continuous Improvement',
    description: 'Implementing continuous improvement strategies in TQM',
    meeting_number: 3,
    points_reward: 150,
    is_active: true,
    created_at: new Date('2024-02-03'),
    updated_at: new Date('2024-02-03')
  },
  {
    id: 4,
    course_id: 1,
    title: '📈 Pertemuan 4: Statistical Quality Control',
    description: 'Using statistical methods for quality control and process improvement',
    meeting_number: 4,
    points_reward: 140,
    is_active: false,
    created_at: new Date('2024-02-10'),
    updated_at: new Date('2024-02-10')
  }
];

const fallbackProgress: StudentProgress = {
  id: 1,
  student_id: 1,
  course_id: 1,
  total_points: 370,
  current_level: 3,
  missions_completed: 2,
  last_activity: new Date(),
  created_at: new Date('2024-01-20'),
  updated_at: new Date()
};

const fallbackLeaderboard: LeaderboardEntry[] = [
  { student_id: 1, student_name: 'Ahmad Pratama', total_points: 370, current_level: 3, missions_completed: 2, rank: 3 },
  { student_id: 3, student_name: 'Siti Nurhaliza', total_points: 520, current_level: 4, missions_completed: 3, rank: 1 },
  { student_id: 4, student_name: 'Budi Santoso', total_points: 450, current_level: 3, missions_completed: 3, rank: 2 },
  { student_id: 5, student_name: 'Maya Sari', total_points: 320, current_level: 2, missions_completed: 2, rank: 4 },
  { student_id: 6, student_name: 'Rizki Pratama', total_points: 280, current_level: 2, missions_completed: 2, rank: 5 }
];

const fallbackLearningMaterials: LearningMaterial[] = [
  {
    id: 1,
    mission_id: 1,
    title: '📖 TQM Fundamentals Lecture',
    content: 'Core concepts and principles of Total Quality Management',
    material_type: 'lecture',
    file_url: null,
    created_at: new Date()
  },
  {
    id: 2,
    mission_id: 1,
    title: '🎥 TQM Introduction Video',
    content: 'Interactive video covering TQM basics',
    material_type: 'video',
    file_url: '/materials/tqm-intro.mp4',
    created_at: new Date()
  },
  {
    id: 3,
    mission_id: 1,
    title: '🔬 Quality Management Simulation',
    content: 'Interactive simulation for understanding quality processes',
    material_type: 'simulation',
    file_url: '/simulations/quality-mgmt',
    created_at: new Date()
  }
];

function App() {
  const [selectedCourse, setSelectedCourse] = useState<number>(1);
  const [courses, setCourses] = useState<Course[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [learningMaterials, setLearningMaterials] = useState<LearningMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load courses
  const loadCourses = useCallback(async () => {
    try {
      const result = await trpc.getCourses.query();
      setCourses(result.length > 0 ? result : fallbackCourses);
    } catch (error) {
      console.error('Failed to load courses:', error);
      setCourses(fallbackCourses);
    }
  }, []);

  // Load missions for selected course
  const loadMissions = useCallback(async (courseId: number) => {
    try {
      const result = await trpc.getMissionsByCourse.query({ courseId });
      setMissions(result.length > 0 ? result : fallbackMissions);
    } catch (error) {
      console.error('Failed to load missions:', error);
      setMissions(fallbackMissions);
    }
  }, []);

  // Load student progress
  const loadProgress = useCallback(async (studentId: number, courseId: number) => {
    try {
      const result = await trpc.getStudentProgress.query({ studentId, courseId });
      setProgress(result || fallbackProgress);
    } catch (error) {
      console.error('Failed to load progress:', error);
      setProgress(fallbackProgress);
    }
  }, []);

  // Load leaderboard
  const loadLeaderboard = useCallback(async (courseId: number) => {
    try {
      const result = await trpc.getLeaderboard.query({ courseId, limit: 10 });
      setLeaderboard(result.length > 0 ? result : fallbackLeaderboard);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setLeaderboard(fallbackLeaderboard);
    }
  }, []);

  // Load learning materials for a mission
  const loadLearningMaterials = useCallback(async (selectedMissionId: number) => {
    try {
      const result = await trpc.getLearningMaterials.query({ missionId: selectedMissionId });
      setLearningMaterials(result.length > 0 ? result : fallbackLearningMaterials);
    } catch (error) {
      console.error('Failed to load learning materials:', error);
      setLearningMaterials(fallbackLearningMaterials);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (selectedCourse) {
      loadMissions(selectedCourse);
      loadProgress(currentUser.id, selectedCourse);
      loadLeaderboard(selectedCourse);
    }
  }, [selectedCourse, loadMissions, loadProgress, loadLeaderboard]);

  useEffect(() => {
    if (selectedMission) {
      loadLearningMaterials(selectedMission.id);
    }
  }, [selectedMission, loadLearningMaterials]);

  const handleMissionClick = (mission: Mission) => {
    setSelectedMission(mission);
  };

  const handleCompleteMission = async (completeMissionId: number) => {
    setIsLoading(true);
    try {
      // In real app, this would call a complete mission API
      // Find the mission being completed to get its point value
      const completedMission = missions.find((m: Mission) => m.id === completeMissionId);
      const pointsToAdd = completedMission?.points_reward || 100;
      
      if (progress) {
        const newTotalPoints = progress.total_points + pointsToAdd;
        const updatedProgress: StudentProgress = {
          ...progress,
          total_points: newTotalPoints,
          missions_completed: progress.missions_completed + 1,
          current_level: Math.floor(newTotalPoints / 200) + 1,
          last_activity: new Date(),
          updated_at: new Date()
        };
        setProgress(updatedProgress);
        
        // Reload leaderboard to reflect changes
        await loadLeaderboard(selectedCourse);
      }
    } catch (error) {
      console.error('Failed to complete mission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelProgress = (points: number): number => {
    const currentLevelPoints = Math.floor(points / 200) * 200;
    const nextLevelPoints = currentLevelPoints + 200;
    return ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
  };

  const getRankEmoji = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🎓 TQM Learning Hub
              </h1>
              <p className="text-lg text-gray-600">
                Gamified Total Quality Management Learning System
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold text-gray-900">{currentUser.full_name}</p>
                <Badge variant="secondary" className="capitalize">
                  {currentUser.role}
                </Badge>
              </div>
              <Avatar className="h-12 w-12">
                <AvatarImage src="/api/placeholder/40/40" />
                <AvatarFallback className="bg-indigo-500 text-white">
                  {currentUser.full_name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        {/* Course Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📚</span>
              <span>Select Course</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCourse.toString()} onValueChange={(value: string) => setSelectedCourse(parseInt(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course: Course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">🏠 Dashboard</TabsTrigger>
            <TabsTrigger value="missions">🎯 Missions</TabsTrigger>
            <TabsTrigger value="materials">📖 Materials</TabsTrigger>
            <TabsTrigger value="leaderboard">🏆 Leaderboard</TabsTrigger>
            <TabsTrigger value="profile">👤 Profile</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Progress Overview */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>📊</span>
                    <span>Your Progress</span>
                  </CardTitle>
                  <CardDescription>Track your learning journey and achievements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {progress && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Level {progress.current_level}</span>
                        <span className="text-sm text-gray-500">
                          {progress.total_points} points
                        </span>
                      </div>
                      <Progress value={getLevelProgress(progress.total_points)} className="h-3" />
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {progress.missions_completed}
                          </div>
                          <div className="text-sm text-gray-600">Missions Completed</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {progress.total_points}
                          </div>
                          <div className="text-sm text-gray-600">Total Points</div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>⚡</span>
                    <span>Quick Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Missions</span>
                    <Badge variant="outline">
                      {missions.filter((m: Mission) => m.is_active).length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Your Rank</span>
                    <Badge variant="secondary">
                      #{leaderboard.find((entry: LeaderboardEntry) => entry.student_id === currentUser.id)?.rank || 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Course Progress</span>
                    <span className="text-sm font-medium">
                      {progress ? Math.round((progress.missions_completed / missions.length) * 100) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📈</span>
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  {progress && (
                    <p>Last activity: {progress.last_activity.toLocaleDateString()} at {progress.last_activity.toLocaleTimeString()}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Missions Tab */}
          <TabsContent value="missions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🎯</span>
                  <span>Learning Missions</span>
                </CardTitle>
                <CardDescription>Complete missions to earn points and progress through the course</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {missions.map((mission: Mission) => (
                    <Card 
                      key={mission.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        !mission.is_active ? 'opacity-60' : ''
                      } ${selectedMission?.id === mission.id ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => handleMissionClick(mission)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{mission.title}</h3>
                            <p className="text-gray-600 mt-1">{mission.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge variant="outline">Meeting {mission.meeting_number}</Badge>
                              <Badge variant="secondary">+{mission.points_reward} points</Badge>
                              {!mission.is_active && <Badge variant="destructive">Locked</Badge>}
                            </div>
                          </div>
                          <div className="ml-4">
                            {mission.is_active && (
                              <Button 
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  handleCompleteMission(mission.id);
                                }}
                                disabled={isLoading}
                                size="sm"
                              >
                                {isLoading ? 'Completing...' : 'Complete'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Learning Materials Tab */}
          <TabsContent value="materials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📖</span>
                  <span>Learning Materials</span>
                </CardTitle>
                <CardDescription>
                  {selectedMission ? 
                    `Materials for: ${selectedMission.title}` : 
                    'Select a mission to view learning materials'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedMission ? (
                  <div className="grid gap-4">
                    {learningMaterials.map((material: LearningMaterial) => (
                      <Card key={material.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              {material.material_type === 'lecture' && <span className="text-lg">📖</span>}
                              {material.material_type === 'video' && <span className="text-lg">🎥</span>}
                              {material.material_type === 'simulation' && <span className="text-lg">🔬</span>}
                              {material.material_type === 'reading' && <span className="text-lg">📚</span>}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold">{material.title}</h3>
                              <p className="text-gray-600 text-sm">{material.content}</p>
                              <Badge variant="outline" className="mt-2 capitalize">
                                {material.material_type}
                              </Badge>
                            </div>
                            <Button variant="outline" size="sm">
                              {material.material_type === 'simulation' ? 'Launch' : 'View'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Please select a mission from the Missions tab to view learning materials.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🏆</span>
                  <span>Course Leaderboard</span>
                </CardTitle>
                <CardDescription>See how you rank against your classmates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaderboard.map((entry: LeaderboardEntry) => (
                    <div 
                      key={entry.student_id}
                      className={`flex items-center space-x-4 p-4 rounded-lg ${
                        entry.student_id === currentUser.id ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="text-2xl">
                        {getRankEmoji(entry.rank)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{entry.student_name}</h3>
                          {entry.student_id === currentUser.id && (
                            <Badge variant="secondary">You</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Level {entry.current_level}</span>
                          <span>•</span>
                          <span>{entry.missions_completed} missions completed</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{entry.total_points}</div>
                        <div className="text-sm text-gray-500">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>👤</span>
                    <span>Profile Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <Input value={currentUser.full_name} disabled className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Username</label>
                    <Input value={currentUser.username} disabled className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <Input value={currentUser.email} disabled className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <Input value={currentUser.role} disabled className="mt-1 capitalize" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>🏅</span>
                    <span>Achievements</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {progress && (
                    <div className="space-y-4">
                      <div className="text-center p-6 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg">
                        <div className="text-4xl mb-2">🎓</div>
                        <div className="font-bold">Level {progress.current_level} Learner</div>
                        <div className="text-sm text-gray-600">
                          {progress.total_points} total points earned
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl mb-1">🎯</div>
                          <div className="font-semibold">Mission Master</div>
                          <div className="text-xs text-gray-600">
                            {progress.missions_completed} completed
                          </div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl mb-1">⭐</div>
                          <div className="font-semibold">Point Collector</div>
                          <div className="text-xs text-gray-600">
                            {progress.total_points} points
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
