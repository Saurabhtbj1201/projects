import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FolderKanban, 
  Mail, 
  CheckCircle, 
  Clock, 
  Star, 
  TrendingUp,
  MessageSquare,
  Calendar,
  ArrowUpRight,
  Eye
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Project, FormSubmission } from "@/types/project";
import { Link } from "react-router-dom";

interface Review {
  id: string;
  name: string;
  rating: number;
  review: string | null;
  project_id: string;
  created_at: string;
  project_name?: string;
}

interface DashboardOverviewProps {
  projects: Project[];
  submissions: (FormSubmission & { projects?: { name: string } | null })[];
  reviews: Review[];
}

const CHART_COLORS = {
  completed: "hsl(142, 71%, 45%)",
  in_progress: "hsl(45, 93%, 47%)",
  planned: "hsl(217, 91%, 60%)",
  enquiries: "hsl(262, 83%, 58%)",
  contacts: "hsl(330, 81%, 60%)",
};

const DashboardOverview = ({
  projects,
  submissions,
  reviews,
}: DashboardOverviewProps) => {
  // Calculate stats
  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const inProgressProjects = projects.filter((p) => p.status === "in_progress").length;
  const plannedProjects = projects.filter((p) => p.status === "planned").length;
  const enquiries = submissions.filter((s) => s.source === "enquiry");
  const contacts = submissions.filter((s) => s.source === "contact");
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  // Project status pie chart data
  const statusData = useMemo(() => [
    { name: "Completed", value: completedProjects, color: CHART_COLORS.completed },
    { name: "In Progress", value: inProgressProjects, color: CHART_COLORS.in_progress },
    { name: "Planned", value: plannedProjects, color: CHART_COLORS.planned },
  ].filter(d => d.value > 0), [completedProjects, inProgressProjects, plannedProjects]);

  // Monthly activity chart (last 6 months)
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const projectsInMonth = projects.filter(p => {
        const createdAt = new Date(p.created_at);
        return isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
      }).length;
      
      const submissionsInMonth = submissions.filter(s => {
        const createdAt = new Date(s.created_at);
        return isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
      }).length;
      
      const reviewsInMonth = reviews.filter(r => {
        const createdAt = new Date(r.created_at);
        return isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
      }).length;

      months.push({
        month: format(monthDate, "MMM"),
        projects: projectsInMonth,
        enquiries: submissionsInMonth,
        reviews: reviewsInMonth,
      });
    }
    return months;
  }, [projects, submissions, reviews]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    projects.forEach(p => {
      categories[p.category] = (categories[p.category] || 0) + 1;
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [projects]);

  // Recent reviews (last 5)
  const recentReviews = useMemo(() => 
    [...reviews]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5),
    [reviews]
  );

  // Recent enquiries (last 5)
  const recentEnquiries = useMemo(() => 
    [...enquiries]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5),
    [enquiries]
  );

  const stats = [
    {
      title: "Total Projects",
      value: projects.length,
      icon: FolderKanban,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      trend: `${completedProjects} completed`,
    },
    {
      title: "Enquiries",
      value: enquiries.length,
      icon: MessageSquare,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      trend: `${enquiries.filter(e => !e.reviewed).length} pending`,
    },
    {
      title: "Contact Forms",
      value: contacts.length,
      icon: Mail,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      trend: `${contacts.filter(c => !c.reviewed).length} pending`,
    },
    {
      title: "Reviews",
      value: reviews.length,
      icon: Star,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      trend: `${avgRating} avg rating`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-serif flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Dashboard Overview
          </h2>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your portfolio.
          </p>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Activity Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEnquiries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="projects" 
                    stroke="hsl(217, 91%, 60%)" 
                    fillOpacity={1} 
                    fill="url(#colorProjects)" 
                    strokeWidth={2}
                    name="Projects"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="enquiries" 
                    stroke="hsl(262, 83%, 58%)" 
                    fillOpacity={1} 
                    fill="url(#colorEnquiries)" 
                    strokeWidth={2}
                    name="Enquiries"
                  />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Project Status Pie Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderKanban className="h-5 w-5 text-primary" />
              Project Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  No projects yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {categoryData.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5 text-primary" />
              Projects by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                    name="Projects"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Reviews */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-amber-500" />
              Recent Reviews
            </CardTitle>
            <Link 
              to="/admin/reviews" 
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentReviews.length > 0 ? (
              recentReviews.map((review) => (
                <div key={review.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {review.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{review.name}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${i < review.rating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/30'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.project_name && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {review.project_name}
                      </Badge>
                    )}
                    {review.review && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{review.review}</p>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No reviews yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Enquiries */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              Recent Enquiries
            </CardTitle>
            <Link 
              to="/admin/enquiries" 
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentEnquiries.length > 0 ? (
              recentEnquiries.map((enquiry) => (
                <div key={enquiry.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-purple-500">
                      {enquiry.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{enquiry.name}</span>
                      {!enquiry.reviewed && (
                        <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{enquiry.email}</p>
                    {enquiry.projects?.name && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {enquiry.projects.name}
                      </Badge>
                    )}
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{enquiry.message}</p>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(enquiry.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No enquiries yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Tips */}
      <Card className="border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Quick Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-blue-500">1</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Add high-quality images to your projects for better engagement
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-purple-500">2</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Keep your site settings updated with relevant SEO keywords
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-green-500">3</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Respond to enquiries promptly to build trust
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
