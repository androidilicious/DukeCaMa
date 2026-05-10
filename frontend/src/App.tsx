import { useEffect, useState } from 'react';
import { BrowserRouter as Router, NavLink, useLocation } from 'react-router-dom';
import {
  Briefcase, Users, MessageSquare, CheckCircle,
  Activity, Bell, GitCommit, Settings,
  Star, Shield,
  Plus, MoreVertical, GitPullRequest, GitBranch, Kanban, Clock,
  CheckCircle2, Lock, ChevronDown
} from 'lucide-react';

// --- MOCK DATA ---
const currentUser = {
  name: "Jane Doe",
  avatar: "https://ui-avatars.com/api/?name=Jane+Doe&background=001A57&color=fff"
};

type Role = "Admin" | "Faculty" | "Student" | "Client" | "Guest";

const statusDotClass = (status: "green" | "yellow" | "gray") => {
  switch (status) {
    case "green":
      return "bg-green-500";
    case "yellow":
      return "bg-yellow-500";
    default:
      return "bg-gray-400";
  }
};

type RepoInfo = {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  updated_at: string;
};

type CommitItem = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
};

type PullItem = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  draft: boolean;
  created_at: string;
  user: { login: string };
};

type IssueItem = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  created_at: string;
  user: { login: string };
  pull_request?: unknown;
};

type ContributorItem = {
  id: number;
  login: string;
  contributions: number;
  html_url: string;
  avatar_url: string;
};

type GithubData = {
  repo: RepoInfo | null;
  commits: CommitItem[];
  pulls: PullItem[];
  issues: IssueItem[];
  contributors: ContributorItem[];
  loading: boolean;
  error: string | null;
};

const GITHUB_REPO = {
  owner: "PinakiG-duke",
  name: "IDS706_DE_FINAL_PROJECT"
};

const widthClassForPercent = (percent: number) => {
  if (percent >= 70) return "w-4/5";
  if (percent >= 50) return "w-3/5";
  if (percent >= 35) return "w-2/5";
  return "w-1/5";
};

const formatShortDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatCommitMessage = (message: string) => message.split("\n")[0];

const useGithubRepoData = (): GithubData => {
  const [data, setData] = useState<GithubData>({
    repo: null,
    commits: [],
    pulls: [],
    issues: [],
    contributors: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const baseUrl = `https://api.github.com/repos/${GITHUB_REPO.owner}/${GITHUB_REPO.name}`;

    const load = async () => {
      try {
        const headers: HeadersInit = {
          Accept: "application/vnd.github+json"
        };
        const token = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const [repoRes, commitsRes, pullsRes, issuesRes, contributorsRes] = await Promise.all([
          fetch(baseUrl, { headers, signal: controller.signal }),
          fetch(`${baseUrl}/commits?per_page=5`, { headers, signal: controller.signal }),
          fetch(`${baseUrl}/pulls?state=open&per_page=5`, { headers, signal: controller.signal }),
          fetch(`${baseUrl}/issues?state=open&per_page=8`, { headers, signal: controller.signal }),
          fetch(`${baseUrl}/contributors?per_page=5`, { headers, signal: controller.signal })
        ]);

        if (!repoRes.ok) {
          throw new Error("Failed to load repo metadata");
        }
        if (!commitsRes.ok) {
          throw new Error("Failed to load commits");
        }
        if (!pullsRes.ok) {
          throw new Error("Failed to load pull requests");
        }
        if (!issuesRes.ok) {
          throw new Error("Failed to load issues");
        }
        if (!contributorsRes.ok) {
          throw new Error("Failed to load contributors");
        }

        const repo = (await repoRes.json()) as RepoInfo;
        const commits = (await commitsRes.json()) as CommitItem[];
        const pulls = (await pullsRes.json()) as PullItem[];
        const issuesRaw = (await issuesRes.json()) as IssueItem[];
        const contributors = (await contributorsRes.json()) as ContributorItem[];

        const issues = issuesRaw.filter((issue) => !issue.pull_request).slice(0, 5);

        if (isMounted) {
          setData({
            repo,
            commits,
            pulls,
            issues,
            contributors,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        if (isMounted) {
          setData((prev) => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : "Failed to load repository data"
          }));
        }
      }
    };

    load();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  return data;
};

// --- CORE LAYOUT ---

const Navbar = ({ role, setRole }: { role: Role, setRole: (r: Role) => void }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const roles: Role[] = ["Admin", "Faculty", "Student", "Client", "Guest"];

  return (
    <nav className="glass-panel-dark text-white shadow-lg w-full sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center hover-scale cursor-pointer">
            <div className="bg-white/10 p-2 rounded-xl mr-4 backdrop-blur-md">
              <Briefcase className="h-7 w-7 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-blue-200">Duke Capstone</span>
          </div>
          <div className="flex items-center space-x-6">

            {/* Custom Role Selector Dropdown */}
            <div className="relative">
              <div
                className="flex items-center bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm backdrop-blur-md border border-white/10 shadow-inner cursor-pointer transition-all"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="mr-2 text-blue-200 font-medium">View As:</span>
                <span className="font-bold mr-1">{role}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Portal Role</p>
                  </div>
                  {roles.map((r) => (
                    <div
                      key={r}
                      className={`px-4 py-2.5 flex items-center justify-between cursor-pointer text-sm font-bold transition-colors ${role === r ? 'bg-indigo-50 text-duke-blue' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                      onClick={() => {
                        setRole(r);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {r === 'Admin' && <Settings className="w-4 h-4" />}
                        {r === 'Faculty' && <Briefcase className="w-4 h-4" />}
                        {r === 'Student' && <Users className="w-4 h-4" />}
                        {r === 'Client' && <Activity className="w-4 h-4" />}
                        {r === 'Guest' && <Star className="w-4 h-4" />}
                        {r}
                      </div>
                      {role === r && <CheckCircle2 className="w-4 h-4 text-duke-blue" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="relative p-2.5 rounded-full hover:bg-white/10 transition-colors duration-200" aria-label="Notifications">
              <Bell className="h-5 w-5 text-blue-100" />
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-duke-blue animate-pulse-slow"></span>
            </button>
            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-blue-300/30 hover:border-white transition-all duration-300 cursor-pointer shadow-lg hover-scale">
              <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const Sidebar = ({ role }: { role: Role }) => {
  const getLinks = () => {
    switch (role) {
      case "Admin": return [
        { name: "Global Dashboard", icon: Activity, path: "/" },
        { name: "Manage Users", icon: Shield, path: "/admin/users" },
        { name: "Settings", icon: Settings, path: "/admin/settings" }
      ];
      case "Faculty": return [
        { name: "Class Overview", icon: Activity, path: "/" },
        { name: "My Teams", icon: Users, path: "/faculty/teams" }
      ];
      case "Student": return [
        { name: "Project Hub", icon: Activity, path: "/" },
        { name: "Task Board", icon: Kanban, path: "/student/tasks" },
        { name: "Repository & Code", icon: GitBranch, path: "/student/code" },
        { name: "Team Health & Evals", icon: Star, path: "/student/evals" },
        { name: "Client Chat", icon: MessageSquare, path: "/student/chat" }
      ];
      case "Client": return [
        { name: "Sponsor Dashboard", icon: Activity, path: "/" },
        { name: "Review Deliverables", icon: CheckCircle, path: "/client/review" }
      ];
      case "Guest": return [
        { name: "Public Catalog", icon: Briefcase, path: "/" }
      ];
    }
  };

  return (
    <div className="w-72 bg-white/60 backdrop-blur-xl border-r border-gray-200/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] h-[calc(100vh-5rem)] hidden md:flex md:flex-col md:justify-between sticky top-20 z-40">
      <div className="p-6 overflow-y-auto">
        <div className="mb-8 px-4">
          <p className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-4">Navigation</p>
        </div>
        <ul className="space-y-2">
          {getLinks().map((link) => (
            <li key={link.name}>
              <NavLink
                to={link.path}
                className={({ isActive }) => `flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive ? "bg-duke-blue text-white shadow-md shadow-blue-900/20 font-semibold" : "text-gray-600 hover:bg-white hover:shadow-sm hover:text-duke-blue"
                  }`}
              >
                {({ isActive }) => (
                  <>
                    <link.icon className={`h-5 w-5 mr-3 transition-colors ${isActive ? "text-white" : "text-gray-400 group-hover:text-duke-blue"}`} /> {link.name}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Optional decorative bottom element */}
      <div className="p-6 border-t border-gray-100/50">
        <div className="bg-linear-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100/50">
          <p className="text-xs font-semibold text-duke-blue">Need help?</p>
          <p className="text-[10px] text-gray-500 mt-1 mb-2">Check the documentation for portal usage.</p>
          <button className="text-xs bg-white text-duke-blue font-bold px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 w-full hover:bg-gray-50 transition-colors">Docs</button>
        </div>
      </div>
    </div>
  );
};

// --- MOCK PAGE ROUTER ---

const MockPageRouter = ({ role, githubData }: { role: Role; githubData: GithubData }) => {
  const location = useLocation();
  const path = location.pathname;

  // ROOT ROUTES BY ROLE
  if (path === "/") {
    switch (role) {
      case "Student": return (
        <div className="space-y-6">
          <div className="border-b border-gray-200/60 pb-6 mb-2">
            <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">{role} Dashboard</h1>
            <p className="text-gray-500 mt-1.5 font-medium">Welcome back. Here is your summarized view.</p>
          </div>
          <StudentHome />
        </div>
      );
      case "Admin": return <AdminHome />;
      case "Faculty": return <FacultyHome />;
      case "Client": return <ClientHome />;
      case "Guest": return <GuestHome />;
    }
  }

  // --- ADMIN VIEWS ---
  if (path === "/admin/users") return <AdminUsersView />;
  if (path === "/admin/settings") return <AdminSettingsView />;

  // --- FACULTY VIEWS ---
  if (path === "/faculty/teams") return <FacultyTeamsView />;

  // --- STUDENT VIEWS ---
  if (path === "/student/code") return <StudentCodeView githubData={githubData} />;
  if (path === "/student/tasks") return <StudentTasksView />;
  if (path === "/student/evals") return <StudentEvalsView />;
  if (path === "/student/chat") return <StudentChatView />;

  // --- CLIENT VIEWS ---
  if (path === "/client/review") return <ClientReviewView />;

  // Fallback Catch All View
  return <ViewScaffold title="View Implementation Placeholder" description={`The mock screen for ${path} is under construction.`} icon={Activity} />;
};

// --- STUDENT SPECIFIC COMPONENTS ---

const StudentHome = () => (
  <div className="space-y-8 mt-4">
    <div className="bg-linear-to-br from-duke-blue via-duke-dark to-[#000b2e] p-10 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,26,87,0.5)] border border-blue-800/50 relative overflow-hidden text-white">
      <div className="absolute top-0 right-0 w-[400px] h-full bg-linear-to-l from-blue-500/20 to-transparent z-0 opacity-60 transform skew-x-12 translate-x-20"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wide border border-white/20 mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse-slow"></span> Active Project
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight drop-shadow-sm">Duke Next-Gen Alpha</h2>
          <p className="text-blue-200 font-medium flex items-center text-sm md:text-base">
            <Briefcase className="h-4 w-4 mr-1.5 opacity-70" /> Sponsor: BlackRock &nbsp; <span className="opacity-40 mx-2">|</span> &nbsp; <Users className="h-4 w-4 mr-1.5 opacity-70" /> Team: Delta
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl hover-scale transition-transform">
          <div className="flex flex-col justify-center items-center px-4 py-2 bg-white/10 rounded-xl border border-white/10">
            <span className="text-3xl font-extrabold text-white drop-shadow-md">A</span>
            <span className="text-[10px] text-blue-200 uppercase font-bold mt-1 tracking-wider">Current Grade</span>
          </div>
          <div className="flex flex-col justify-center items-center px-4 py-2">
            <span className="text-3xl font-extrabold text-white drop-shadow-md">9.2</span>
            <span className="text-[10px] text-blue-200 uppercase font-bold mt-1 tracking-wider">Team Health</span>
          </div>
        </div>
      </div>

      <div className="mt-8 relative z-10 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-white tracking-wide">Sprint 2: Deep Learning Integration</span>
          <span className="text-sm font-extrabold text-blue-200 bg-white/10 px-2 py-0.5 rounded-md">65% Complete</span>
        </div>
        <div className="w-full bg-black/40 rounded-full h-4 mb-3 border border-white/5 overflow-hidden shadow-inner">
          <div className="bg-linear-to-r from-blue-400 to-indigo-300 h-full rounded-full transition-all duration-1000 ease-out w-[65%] relative">
            <div className="absolute inset-0 bg-white/20 w-full h-full animate-[pulse_2s_ease-in-out_infinite]"></div>
          </div>
        </div>
        <p className="text-xs text-blue-200/70 font-bold uppercase tracking-wider flex items-center"><Clock className="w-3 h-3 mr-1" /> Midterm Demo due in 4 days</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* My Upcoming Tasks */}
      <div className="glass-panel rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-7 hover-lift">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-extrabold text-xl text-gray-800 flex items-center tracking-tight"><CheckCircle2 className="mr-2 text-duke-blue" /> Upcoming Tasks</h3>
          <button className="text-xs font-bold text-duke-blue hover:text-duke-dark bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">View All</button>
        </div>
        <ul className="space-y-4">
          <li className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-md border-2 border-gray-300 group-hover:border-duke-blue transition-colors flex items-center justify-center"></div>
              <span className="font-semibold text-gray-700 group-hover:text-duke-blue transition-colors">Update Prisma Schema</span>
            </div>
            <span className="text-xs bg-red-50 border border-red-100 text-red-600 font-bold px-2.5 py-1 rounded-lg">Due Today</span>
          </li>
          <li className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-md border-2 border-gray-300 group-hover:border-duke-blue transition-colors flex items-center justify-center"></div>
              <span className="font-semibold text-gray-700 group-hover:text-duke-blue transition-colors">Client Demo Slides</span>
            </div>
            <span className="text-xs bg-amber-50 border border-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-lg">Tomorrow</span>
          </li>
        </ul>
      </div>

      {/* Team Roster Hub */}
      <div className="glass-panel rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-7 hover-lift">
        <h3 className="font-extrabold text-xl text-gray-800 mb-6 flex items-center tracking-tight"><Users className="mr-2 text-duke-blue" /> Team Roster</h3>
        <div className="space-y-5">
          {[
            { name: "Jane Doe", role: "Backend Lead", status: "Online", color: "green", you: true },
            { name: "Mike Smith", role: "Frontend UI", status: "In class", color: "yellow", you: false },
            { name: "Sarah Connor", role: "ML Engineer", status: "Offline", color: "gray", you: false },
          ].map(member => (
            <div key={member.name} className="flex items-center justify-between p-3 -mx-3 rounded-2xl hover:bg-gray-50/80 transition-colors">
              <div className="flex items-center gap-4">
                <div className="relative hover-scale">
                  <img src={`https://ui-avatars.com/api/?name=${member.name.replace(' ', '+')}&background=${member.you ? '001A57' : 'f3f4f6'}&color=${member.you ? 'fff' : '001A57'}`} alt="Avatar" className="w-11 h-11 rounded-full border-2 border-white shadow-sm" />
                  <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${statusDotClass(member.color as any)} border-2 border-white shadow-sm`}></span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{member.name}</span>
                    {member.you && <span className="text-[10px] font-bold bg-duke-blue/10 text-duke-blue px-1.5 rounded uppercase">You</span>}
                  </div>
                  <span className="text-xs text-gray-500 font-medium mt-0.5">{member.role}</span>
                </div>
              </div>
              {!member.you && <button className="text-xs font-bold text-duke-blue bg-white border border-gray-200 shadow-sm px-3 py-1.5 rounded-lg hover:border-duke-blue hover:text-duke-blue hover:shadow transition-all">Ping</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const StudentTasksView = () => (
  <div className="h-full flex flex-col">
    <div className="flex justify-between items-center mb-6 border-b pb-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Team Kanban Board</h1>
        <p className="text-gray-500 text-sm">Sprint 2 · Oct 1 - Oct 14</p>
      </div>
      <button className="bg-duke-blue text-white px-4 py-2 rounded font-bold shadow text-sm hover:bg-duke-dark flex items-center"><Plus className="h-4 w-4 mr-2" /> Create Task</button>
    </div>

    <div className="flex gap-6 overflow-x-auto pb-4 flex-1">
      {/* COLUMN 1 */}
      <div className="w-80 shrink-0 flex flex-col bg-gray-50/80 rounded-xl border border-gray-100/50 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-700 flex items-center">To Do <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full ml-2">3</span></h3>
        </div>
        <div className="space-y-3">
          <TaskCard title="Review feedback from Sponsor" assignee="JS" tag="Planning" date="Oct 10" />
          <TaskCard title="Draft Final Architecture Diagram" assignee="SA" tag="Design" date="Oct 12" />
        </div>
      </div>

      {/* COLUMN 2 */}
      <div className="w-80 shrink-0 flex flex-col bg-gray-50/80 rounded-xl border border-gray-100/50 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-700 flex items-center">In Progress <span className="bg-blue-100 text-duke-blue text-xs font-bold px-2 py-0.5 rounded-full ml-2">2</span></h3>
        </div>
        <div className="space-y-3">
          <TaskCard title="Integrate OAuth with Clerk" assignee="Me" tag="Backend" date="Oct 8" />
          <TaskCard title="Setup PostgreSQL DB" assignee="Me" tag="Database" date="Oct 9" />
        </div>
      </div>

      {/* COLUMN 3 */}
      <div className="w-80 shrink-0 flex flex-col bg-gray-50/80 rounded-xl border border-gray-100/50 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-700 flex items-center">In Review <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full ml-2">1</span></h3>
        </div>
        <div className="space-y-3">
          <TaskCard title="Frontend Dashboard Scaffold" assignee="MK" tag="Frontend" date="Oct 5" />
        </div>
      </div>

      {/* COLUMN 4 */}
      <div className="w-80 shrink-0 flex flex-col bg-gray-50/80 rounded-xl border border-gray-100/50 p-4 opacity-75">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-700 flex items-center">Done <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full ml-2">5</span></h3>
        </div>
        <div className="space-y-3">
          <TaskCard title="Project Roadmap Submit" assignee="Team" tag="Deliverable" date="Sep 28" />
        </div>
      </div>
    </div>
  </div>
);

const TaskCard = ({ title, assignee, tag, date }: any) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer group">
    <div className="flex justify-between items-start mb-2">
      <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{tag}</span>
      <MoreVertical className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
    </div>
    <h4 className="text-sm font-bold text-gray-800 mb-3 leading-tight">{title}</h4>
    <div className="flex justify-between items-center border-t pt-3 mt-1">
      <div className="flex items-center text-xs text-gray-500 font-semibold"><Clock className="h-3 w-3 mr-1" /> {date}</div>
      <div className="h-6 w-6 rounded-full bg-duke-blue text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white shadow-sm">{assignee}</div>
    </div>
  </div>
);

const StudentCodeView = ({ githubData }: { githubData: GithubData }) => {
  const { repo, commits, pulls, issues, contributors, loading, error } = githubData;
  const totalContrib = contributors.reduce((sum, contributor) => sum + contributor.contributions, 0);
  const repoUrl = repo?.html_url ?? `https://github.com/${GITHUB_REPO.owner}/${GITHUB_REPO.name}`;
  const repoName = repo?.full_name ?? `${GITHUB_REPO.owner}/${GITHUB_REPO.name}`;
  const lastSynced = repo?.updated_at ? formatShortDate(repo.updated_at) : "Unknown";

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm text-center">
        <p className="text-sm font-semibold text-gray-600">Loading live GitHub data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-100 rounded-xl p-8 shadow-sm text-center">
        <p className="text-sm font-semibold text-red-600">{error}</p>
        <p className="text-xs text-gray-500 mt-2">GitHub API rate limits can apply without a token.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-6 bg-linear-to-r from-gray-900 to-gray-800 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center mb-2">
              <svg height="24" viewBox="0 0 16 16" version="1.1" width="24" className="mr-3 fill-current text-white"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
              <a href={repoUrl} target="_blank" rel="noreferrer" className="text-xl font-bold text-gray-100 hover:underline">
                {repoName}
              </a>
            </div>
            <p className="text-sm text-gray-300 font-medium ml-9">{repo?.description ?? "No description provided."}</p>
            <p className="text-xs text-gray-400 font-medium ml-9">Last synced {lastSynced} · Default branch {repo?.default_branch ?? "main"}</p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold">{repo?.stargazers_count ?? 0}</p>
              <p className="text-xs text-gray-400 uppercase font-bold">Stars</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{repo?.forks_count ?? 0}</p>
              <p className="text-xs text-gray-400 uppercase font-bold">Forks</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-300">{repo?.open_issues_count ?? 0}</p>
              <p className="text-xs text-gray-400 uppercase font-bold">Open Issues</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center"><GitCommit className="mr-2 text-duke-blue" /> Recent Commits</h3>
            <a href={`${repoUrl}/commits`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-duke-blue bg-blue-50 px-3 py-1 rounded">View on GitHub</a>
          </div>
          <div className="divide-y">
            {commits.map((commit) => (
              <div key={commit.sha} className="px-6 py-4 flex items-center hover:bg-gray-50 transition">
                <div className="mr-4">
                  {commit.commit.message.startsWith("Merge") ? <GitMergeIcon /> : <GitCommit className="text-gray-400 h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <a href={commit.html_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-gray-800 leading-tight hover:underline">
                    {formatCommitMessage(commit.commit.message)}
                  </a>
                  <div className="flex items-center text-xs text-gray-500 font-medium mt-1">
                    <span className="bg-gray-100 text-gray-600 font-mono px-1 rounded mr-2">{commit.sha.slice(0, 7)}</span>
                    <span className="mr-2 border-r pr-2">{commit.commit.author.name}</span>
                    <span>{formatShortDate(commit.commit.author.date)}</span>
                  </div>
                </div>
              </div>
            ))}
            {commits.length === 0 && (
              <div className="px-6 py-6 text-sm text-gray-500">No commits returned by the GitHub API.</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center"><GitPullRequest className="mr-2 text-green-500" /> Open Pull Requests</h3>
            <div className="space-y-4">
              {pulls.map((pull) => (
                <div key={pull.id} className="border border-gray-200 rounded-lg p-3 hover:border-green-300 transition">
                  <a href={pull.html_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-gray-800 mb-1 hover:underline block">
                    {pull.title} <span className="text-gray-400 font-normal">#{pull.number}</span>
                  </a>
                  <div className="flex justify-between items-center">
                    <p className={`text-xs font-semibold px-2 py-0.5 rounded ${pull.draft ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-green-600"}`}>
                      {pull.draft ? "Draft" : "Ready"}
                    </p>
                    <span className="text-xs text-gray-500">{pull.user.login}</span>
                  </div>
                </div>
              ))}
              {pulls.length === 0 && (
                <div className="text-sm text-gray-500">No open pull requests.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4">Open Issues</h3>
            <div className="space-y-3">
              {issues.map((issue) => (
                <a key={issue.id} href={issue.html_url} target="_blank" rel="noreferrer" className="block text-sm text-gray-700 hover:underline">
                  {issue.title} <span className="text-xs text-gray-400">#{issue.number}</span>
                  <span className="block text-xs text-gray-400">{issue.user.login} · {formatShortDate(issue.created_at)}</span>
                </a>
              ))}
              {issues.length === 0 && (
                <div className="text-sm text-gray-500">No open issues.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-800">Top Contribution Share</h3>
                <p className="text-xs text-gray-500">Single stacked bar · last 50 commits</p>
              </div>
              <span className="text-xs font-semibold text-gray-400">Commits</span>
            </div>
            {contributors.length > 0 ? (
              <div className="space-y-5">
                <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden flex">
                  {contributors.map((contributor) => {
                    const percent = totalContrib > 0 ? (contributor.contributions / totalContrib) * 100 : 0;
                    return (
                      <div
                        key={contributor.id}
                        className={`h-full ${widthClassForPercent(percent)} ${contributor.id % 2 === 0 ? "bg-duke-blue" : "bg-blue-400"}`}
                        title={`${contributor.login} · ${Math.round(percent)}%`}
                      ></div>
                    );
                  })}
                </div>
                <div className="space-y-3">
                  {contributors.map((contributor) => {
                    const percent = totalContrib > 0 ? Math.round((contributor.contributions / totalContrib) * 100) : 0;
                    return (
                      <div key={contributor.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={contributor.avatar_url} alt={contributor.login} className="h-6 w-6 rounded-full border border-gray-200" />
                          <a href={contributor.html_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-gray-700 hover:underline">
                            {contributor.login}
                          </a>
                        </div>
                        <div className="text-xs text-gray-500 font-semibold">{percent}% · {contributor.contributions}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No contributor data found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const GitMergeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path></svg>;

const StudentEvalsView = () => (
  <div className="space-y-6">
    <div className="border-b pb-4">
      <h1 className="text-2xl font-bold text-gray-800">Team Health & Peer Evaluations</h1>
      <p className="text-gray-500 mt-1 text-sm">Submit your mid-semester evaluations and view your aggregated anonymized feedback.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white border rounded-xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Action Required: Midterm Eval</h2>
        <p className="text-sm text-gray-600 mb-6">Faculty requires you to score your teammates on communication, technical contribution, and reliability.</p>

        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-gray-800 flex items-center justify-between mb-2">Member: <span className="bg-gray-100 px-3 py-1 rounded text-duke-blue">Mike Smith</span></h4>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Technical Contribution</p>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(v => <button key={v} className="flex-1 py-1 border rounded hover:bg-duke-blue hover:text-white transition font-bold text-sm">{v}</button>)}
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Private Feedback (Seen only by Faculty)</p>
            <textarea className="w-full text-sm p-3 border rounded focus:ring-1 focus:ring-duke-blue focus:outline-none" placeholder="Provide context for Mike's scores..."></textarea>
          </div>

          <button className="w-full bg-duke-blue text-white font-bold py-3 rounded-lg shadow-md hover:bg-duke-dark transition">Submit Confidential Form</button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-linear-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-8 shadow-sm text-center">
          <h2 className="text-lg font-bold text-green-900 mb-2">Your Team Pulse</h2>
          <div className="text-5xl font-extrabold text-green-600 mb-2">9.2 / 10</div>
          <p className="text-sm font-medium text-green-800 max-w-sm mx-auto">Based on your team's Git velocity, task completion rate, and initial peer surveys, your collaboration is highly effective.</p>
        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Anonymized Feedback Summary</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 border rounded-lg italic text-sm text-gray-700 shadow-inner relative">
              <span className="absolute -top-3 left-4 text-3xl text-gray-300 font-serif">"</span>
              Jane has been an excellent leader coordinating the backend implementation. She sets clear expectations.
              <span className="block mt-2 font-bold text-xs text-duke-blue not-italic uppercase tracking-wider">- Teammate (Anonymized)</span>
            </div>
            <div className="p-4 bg-gray-50 border rounded-lg italic text-sm text-gray-700 shadow-inner relative">
              <span className="absolute -top-3 left-4 text-3xl text-gray-300 font-serif">"</span>
              Great code quality, but sometimes pushes large commits without waiting for PR reviews.
              <span className="block mt-2 font-bold text-xs text-duke-blue not-italic uppercase tracking-wider">- Teammate (Anonymized)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ViewScaffold = ({ title, description, icon: Icon }: { title: string, description: string, icon: any }) => (
  <div className="flex flex-col items-center justify-center h-full py-24 px-4 text-center">
    <div className="bg-white/60 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white mb-6 hover-scale transition-transform">
      <Icon className="h-16 w-16 text-duke-blue" strokeWidth={1.5} />
    </div>
    <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight mb-3">{title}</h2>
    <p className="text-gray-500 max-w-md mx-auto text-lg leading-relaxed">{description}</p>
  </div>
);

// --- ADMIN VIEWS ---
const AdminHome = () => (
  <div className="space-y-8 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
    {/* Quick Action Bar */}
    <div className="flex flex-wrap gap-4 items-center justify-between bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-white shadow-sm">
      <div className="flex gap-2">
        <button className="bg-duke-blue text-white px-4 py-2 rounded-xl text-sm font-extrabold shadow-sm hover:bg-duke-dark transition-colors flex items-center gap-2"><Plus className="w-4 h-4" /> New Semester</button>
        <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2"><Activity className="w-4 h-4" /> Sync Canvas Roster</button>
      </div>
      <div className="flex gap-2">
        <button className="text-gray-500 hover:text-duke-blue px-4 py-2 rounded-xl text-sm font-bold transition-colors">Export Global Report</button>
      </div>
    </div>

    {/* Top Metrics Row */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-2 bg-linear-to-br from-indigo-600 via-blue-700 to-duke-dark p-8 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,26,87,0.5)] border border-blue-500/30 relative overflow-hidden text-white group hover-lift flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-12 translate-x-10 group-hover:translate-x-20 transition-transform duration-700"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h3 className="text-sm font-extrabold text-blue-200 uppercase tracking-widest mb-1">Active Capstone Projects</h3>
            <div className="flex items-end gap-4">
              <p className="text-6xl font-black tracking-tighter drop-shadow-sm">42</p>
              <div className="mb-2 bg-green-500/20 text-green-300 px-2 py-0.5 rounded-md text-sm font-bold flex items-center border border-green-500/30 backdrop-blur-sm">
                <Activity className="w-4 h-4 mr-1" /> +15%
              </div>
            </div>
          </div>
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
            <Briefcase className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="relative z-10 mt-6">
          <div className="flex justify-between text-xs font-bold text-blue-200 uppercase tracking-widest mb-2"><span>Resource Allocation</span><span>42%</span></div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white/80 w-[42%] rounded-full shadow-[0_0_10px_#fff]"></div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl shadow-sm border border-white hover-lift flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-100 rounded-full blur-2xl opacity-50"></div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">Total Users <Users className="w-4 h-4 text-gray-400" /></h3>
        <p className="text-5xl font-extrabold text-gray-800 tracking-tight">1,248</p>
        <div className="flex gap-2 mt-3">
          <span className="text-[10px] font-bold text-duke-blue bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">312 Students</span>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wider">45 Clients</span>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl shadow-sm border border-white hover-lift flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-green-100 rounded-full blur-2xl opacity-50"></div>
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">System Health</h3>
          <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_10px_#22c55e]"></span></span>
        </div>
        <p className="text-5xl font-extrabold text-green-500 tracking-tight drop-shadow-sm">99.9<span className="text-2xl text-green-300">%</span></p>
        <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">All services operational</p>
      </div>
    </div>

    {/* Bottom Section */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Activity Timeline */}
      <div className="lg:col-span-2 glass-panel p-8 rounded-3xl shadow-sm border border-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-bl from-gray-50 to-transparent pointer-events-none"></div>
        <div className="flex justify-between items-center mb-8 relative z-10">
          <h3 className="font-extrabold text-xl text-gray-800 flex items-center tracking-tight"><Bell className="mr-2 text-duke-blue" /> Audit Log & Events</h3>
          <button className="text-xs font-bold text-gray-500 hover:text-duke-blue bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">View Full Log</button>
        </div>

        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-gray-200 before:via-gray-200 before:to-transparent pl-4 md:pl-0">
          {[
            { title: "Authentication Provider Sync", time: "10 mins ago", icon: Users, color: "blue", details: "Synced 120 new student roles from Duke Shibboleth Identity Provider. Zero conflicts reported.", user: "System" },
            { title: "Database Snapshot Created", time: "2 hours ago", icon: Activity, color: "green", details: "Automated snapshot 'duke_cama_db_v2_10492' successfully written to AWS S3 Glacier.", user: "Admin" },
            { title: "GitHub API Latency Spike", time: "Yesterday", icon: Activity, color: "yellow", details: "Commit ingestion worker experienced > 5000ms latency. Retrying queued jobs.", user: "System" },
            { title: "New Organization Created", time: "Yesterday", icon: Briefcase, color: "indigo", details: "Sponsor 'BlackRock' workspace provisioned by admin.", user: "Admin" },
          ].map((event, i) => (
            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-white shadow-sm text-gray-500 group-hover:text-duke-blue group-hover:scale-110 transition-all z-10">
                <event.icon className={`w-4 h-4 text-${event.color}-500`} />
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all hover-scale cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-transparent via-gray-200 to-transparent group-hover:via-duke-blue transition-colors"></div>
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-gray-800 text-sm">{event.title}</h4>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">{event.time}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{event.details}</p>
                <div className="mt-3 flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-600">{event.user[0]}</div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{event.user}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Graphs & Quick Stats */}
      <div className="flex flex-col gap-8">
        {/* Server Load Mock */}
        <div className="glass-panel p-8 rounded-3xl shadow-sm border border-white flex flex-col flex-1">
          <h3 className="font-extrabold text-xl text-gray-800 mb-6 flex items-center tracking-tight"><Activity className="mr-2 text-duke-blue" /> Server Load Matrix</h3>
          <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-100 p-4 flex flex-col justify-center gap-1.5 shadow-inner">
            {Array.from({ length: 10 }).map((_, r) => (
              <div key={r} className="flex gap-1.5 justify-center">
                {Array.from({ length: 12 }).map((_, c) => {
                  const intensity = Math.random();
                  const isHigh = intensity > 0.8;
                  const opacity = Math.max(0.1, intensity * (r / 10));
                  return <div key={c} className={`w-4 h-4 rounded-sm transition-all duration-1000 ${isHigh && r > 7 ? 'bg-amber-400 animate-pulse' : 'bg-duke-blue'}`} style={{ opacity: isHigh ? 1 : opacity }}></div>
                })}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between items-center px-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">us-east-1</span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">us-west-2</span>
          </div>
        </div>

        {/* Storage Mock */}
        <div className="glass-panel p-6 rounded-3xl shadow-sm border border-white relative overflow-hidden bg-gray-900 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
          <h3 className="font-extrabold text-sm text-gray-300 mb-4 uppercase tracking-widest">Storage Utilization</h3>
          <div className="flex items-end gap-2 mb-4">
            <p className="text-4xl font-black tracking-tight">842 <span className="text-xl text-gray-400">GB</span></p>
          </div>
          <div className="flex h-3 w-full bg-gray-800 rounded-full overflow-hidden shadow-inner mb-3">
            <div className="h-full bg-blue-500 w-[60%]"></div>
            <div className="h-full bg-indigo-500 w-[20%]"></div>
            <div className="h-full bg-purple-500 w-[10%]"></div>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> DB</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> S3 Assets</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Logs</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AdminUsersView = () => (
  <div className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Manage Users Directory</h2>
        <p className="text-gray-500 font-medium text-sm mt-1">Showing 1,248 accounts across 4 distinct roles.</p>
      </div>
      <div className="flex flex-wrap gap-3 w-full md:w-auto">
        <div className="relative flex-1 md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input type="text" className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-duke-blue focus:border-duke-blue sm:text-sm transition-shadow shadow-sm font-medium" placeholder="Search by name, NetID, or email..." />
        </div>
        <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition flex items-center gap-2"><Settings className="w-4 h-4" /> Filters <span className="bg-gray-100 text-gray-500 px-1.5 rounded text-xs">2</span></button>
        <button className="bg-duke-blue text-white px-4 py-2.5 rounded-xl font-bold shadow-md hover:bg-duke-dark transition hover-lift flex items-center gap-2"><Plus className="w-4 h-4" /> Provision User</button>
      </div>
    </div>

    {/* Bulk Action Bar Mock (hidden normally, shown here for visual richness) */}
    <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in zoom-in duration-300">
      <span className="text-sm font-bold text-indigo-800 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> 2 Users Selected</span>
      <div className="flex gap-2">
        <button className="bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-100 transition-colors">Export CSV</button>
        <button className="bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-100 transition-colors">Change Role</button>
        <button className="bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-red-100 transition-colors">Suspend</button>
      </div>
    </div>

    <div className="glass-panel rounded-3xl border border-white overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/40">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/80 border-b border-gray-200 backdrop-blur-md sticky top-0 z-10">
            <tr>
              <th className="p-4 pl-6 text-xs font-extrabold text-gray-500 uppercase tracking-widest w-10"><input type="checkbox" className="rounded text-duke-blue focus:ring-duke-blue border-gray-300" defaultChecked /></th>
              <th className="p-4 text-xs font-extrabold text-gray-500 uppercase tracking-widest">User Details</th>
              <th className="p-4 text-xs font-extrabold text-gray-500 uppercase tracking-widest">Role & Affiliation</th>
              <th className="p-4 text-xs font-extrabold text-gray-500 uppercase tracking-widest">Activity Score</th>
              <th className="p-4 text-xs font-extrabold text-gray-500 uppercase tracking-widest">Status</th>
              <th className="p-4 text-xs font-extrabold text-gray-500 uppercase tracking-widest">Last Active</th>
              <th className="p-4 pr-6 text-xs font-extrabold text-gray-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/80 bg-white/60 backdrop-blur-sm">
            {[
              { name: "Jane Doe", email: "jane.doe@duke.edu", role: "Student", team: "Team Delta", status: "Active", last: "2m ago", avatar: "JD", selected: true, score: 85 },
              { name: "Dr. Smith", email: "jsmith@duke.edu", role: "Faculty", team: "CS 408 Admin", status: "Active", last: "1h ago", avatar: "DS", selected: false, score: 40 },
              { name: "Alice Johnson", email: "alice.j@blackrock.com", role: "Client", team: "BlackRock", status: "Invited", last: "Never", avatar: "AJ", selected: true, score: 0 },
              { name: "Bob Wilson", email: "bob.w@duke.edu", role: "Student", team: "Team Sigma", status: "Suspended", last: "3w ago", avatar: "BW", selected: false, score: 10 },
              { name: "System Admin", email: "admin@duke.edu", role: "Admin", team: "Global", status: "Active", last: "Just now", avatar: "SA", selected: false, score: 99 },
            ].map((u, idx) => (
              <tr key={idx} className={`transition-colors group hover:bg-blue-50/60 ${u.selected ? 'bg-indigo-50/30' : ''}`}>
                <td className="p-4 pl-6"><input type="checkbox" className="rounded text-duke-blue focus:ring-duke-blue border-gray-300" defaultChecked={u.selected} /></td>
                <td className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`h-11 w-11 rounded-full bg-linear-to-br text-white font-black flex items-center justify-center shadow-md ring-2 ring-white group-hover:ring-blue-100 transition-all ${u.role === 'Admin' ? 'from-purple-500 to-indigo-600' : u.role === 'Faculty' ? 'from-amber-500 to-orange-500' : u.role === 'Client' ? 'from-emerald-500 to-teal-500' : 'from-duke-blue to-blue-400'}`}>
                        {u.avatar}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${u.status === 'Active' ? 'bg-green-500' : u.status === 'Invited' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                    </div>
                    <div>
                      <p className="font-extrabold text-gray-800 text-sm group-hover:text-duke-blue transition-colors">{u.name}</p>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1.5 items-start">
                    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-700 border border-gray-200 shadow-sm"><Shield className="w-3 h-3" /> {u.role}</span>
                    <span className="text-xs font-bold text-gray-500">{u.team}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="w-24 h-6 flex items-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className={`w-full rounded-t-sm ${u.score === 0 ? 'bg-gray-200' : 'bg-duke-blue'}`} style={{ height: u.score === 0 ? '2px' : `${Math.max(10, Math.random() * u.score)}%` }}></div>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center py-1.5 px-3 rounded-full text-xs font-bold shadow-sm border ${u.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : u.status === 'Invited' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="p-4 text-xs font-bold text-gray-500 tracking-wide uppercase">{u.last}</td>
                <td className="p-4 pr-6 text-right">
                  <button className="p-2 text-gray-400 hover:text-duke-blue hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-200 transition-all"><MoreVertical className="w-5 h-5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-gray-200 bg-white/80 backdrop-blur-md flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Showing <span className="text-gray-800">1</span> to <span className="text-gray-800">5</span> of <span className="text-gray-800">1,248</span></span>
        <div className="flex gap-1.5">
          <button className="px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-xs font-bold text-gray-400 cursor-not-allowed shadow-inner">Prev</button>
          <button className="px-3 py-1.5 border border-duke-blue rounded-lg bg-duke-blue text-xs font-bold text-white shadow-md hover:bg-duke-dark transition-colors">1</button>
          <button className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 shadow-sm transition-colors">2</button>
          <button className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 shadow-sm transition-colors">3</button>
          <span className="px-2 py-1.5 text-gray-400 font-bold">...</span>
          <button className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 shadow-sm transition-colors">Next</button>
        </div>
      </div>
    </div>
  </div>
);

const AdminSettingsView = () => {
  const [activeTab, setActiveTab] = useState('global');

  return (
    <div className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">System Configuration</h2>
          <p className="text-gray-500 font-medium mt-2">Manage global platform behaviors, API integrations, and security policies.</p>
        </div>
        <button className="bg-duke-blue text-white px-6 py-2.5 rounded-xl font-extrabold shadow-lg shadow-blue-900/20 hover:bg-duke-dark transition-all hover-lift flex items-center gap-2">
          Save All Changes
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Nav Sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white/60 backdrop-blur-md rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col gap-2 sticky top-4">
            <button onClick={() => setActiveTab('global')} className={`w-full text-left px-5 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-3 ${activeTab === 'global' ? 'bg-duke-blue text-white shadow-md shadow-blue-900/20 font-extrabold' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}><Settings className="w-4 h-4" /> Global Preferences</button>
            <button onClick={() => setActiveTab('security')} className={`w-full text-left px-5 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-3 ${activeTab === 'security' ? 'bg-duke-blue text-white shadow-md shadow-blue-900/20 font-extrabold' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}><Shield className="w-4 h-4" /> Security & Auth</button>
            <button onClick={() => setActiveTab('api')} className={`w-full text-left px-5 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-3 ${activeTab === 'api' ? 'bg-duke-blue text-white shadow-md shadow-blue-900/20 font-extrabold' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}><Activity className="w-4 h-4" /> API Integrations</button>
            <button onClick={() => setActiveTab('roles')} className={`w-full text-left px-5 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-3 ${activeTab === 'roles' ? 'bg-duke-blue text-white shadow-md shadow-blue-900/20 font-extrabold' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}><Users className="w-4 h-4" /> Roles & Access</button>
            <div className="h-px bg-gray-200 my-2"></div>
            <button onClick={() => setActiveTab('danger')} className={`w-full text-left px-5 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-3 ${activeTab === 'danger' ? 'bg-red-600 text-white shadow-md shadow-red-900/20' : 'text-red-600 hover:bg-red-50 hover:shadow-sm'}`}>Danger Zone</button>
          </div>
        </div>

        {/* Settings Form Body */}
        <div className="flex-1 space-y-8 min-h-[500px]">

          {activeTab === 'global' && (
            <div className="animate-in fade-in zoom-in-95 duration-300 space-y-8">
              {/* Email / Notifications Mock */}
              <div className="glass-panel p-8 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2"><svg className="w-5 h-5 text-duke-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> Email & SMTP Configuration</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">SMTP Host</label>
                    <input type="text" defaultValue="smtp.sendgrid.net" className="w-full bg-white border border-gray-200 text-sm font-medium text-gray-800 px-4 py-2.5 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-duke-blue" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">SMTP Port</label>
                    <input type="number" defaultValue={587} className="w-full bg-white border border-gray-200 text-sm font-medium text-gray-800 px-4 py-2.5 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-duke-blue" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Sender Email Address (From)</label>
                    <input type="email" defaultValue="capstone-noreply@duke.edu" className="w-full bg-white border border-gray-200 text-sm font-medium text-gray-800 px-4 py-2.5 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-duke-blue" />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
                  <button className="bg-duke-blue text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-duke-dark transition-colors">Save SMTP Settings</button>
                  <button className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors">Send Test Email</button>
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="glass-panel p-8 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2"><Shield className="w-5 h-5 text-duke-blue" /> Platform Toggles & Features</h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm group hover:border-duke-blue/30 transition-colors">
                    <div className="max-w-md">
                      <h4 className="font-extrabold text-gray-800 flex items-center gap-2"><Activity className="w-4 h-4 text-amber-500" /> Maintenance Mode</h4>
                      <p className="text-xs font-medium text-gray-500 mt-1 leading-relaxed">Instantly lock out all non-admin users. Custom message displayed.</p>
                    </div>
                    <div className="w-14 h-7 bg-gray-200 rounded-full cursor-pointer relative shadow-inner transition-colors group-hover:bg-gray-300">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-1 left-1 shadow-md transition-transform"></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm group hover:border-duke-blue/30 transition-colors">
                    <div className="max-w-md">
                      <h4 className="font-extrabold text-gray-800 flex items-center gap-2"><Users className="w-4 h-4 text-green-500" /> Public Registration</h4>
                      <p className="text-xs font-medium text-gray-500 mt-1 leading-relaxed">Allow anyone with a @duke.edu email address to automatically provision a Student account.</p>
                    </div>
                    <div className="w-14 h-7 bg-green-500 rounded-full cursor-pointer relative shadow-inner shadow-green-700/50 transition-colors">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-1 right-1 shadow-md transition-transform"></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-linear-to-r from-indigo-50 to-white rounded-2xl border border-indigo-100 shadow-sm group hover:border-indigo-300 transition-colors">
                    <div className="max-w-md">
                      <h4 className="font-extrabold text-indigo-900 flex items-center gap-2"><svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> AI Team Matchmaking Beta</h4>
                      <p className="text-xs font-medium text-indigo-700/70 mt-1 leading-relaxed">Enable the experimental LLM-based student-to-project allocation engine for Faculty.</p>
                    </div>
                    <div className="w-14 h-7 bg-indigo-500 rounded-full cursor-pointer relative shadow-inner shadow-indigo-700/50 transition-colors">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-1 right-1 shadow-md transition-transform"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="animate-in fade-in zoom-in-95 duration-300 space-y-8">
              <div className="glass-panel p-8 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2"><Shield className="w-5 h-5 text-duke-blue" /> Authentication Providers</h3>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-2xl bg-white p-5 flex justify-between items-center shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-duke-blue"></div>
                    <div>
                      <h4 className="font-extrabold text-gray-800">Duke Shibboleth (SAML)</h4>
                      <p className="text-xs text-gray-500 mt-1">Primary SSO for all `@duke.edu` accounts.</p>
                    </div>
                    <span className="bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-green-200">Active</span>
                  </div>
                  <div className="border border-gray-200 rounded-2xl bg-gray-50 p-5 flex justify-between items-center shadow-sm relative overflow-hidden opacity-70">
                    <div>
                      <h4 className="font-extrabold text-gray-800">Auth0 Enterprise</h4>
                      <p className="text-xs text-gray-500 mt-1">Fallback identity provider for guest/client accounts.</p>
                    </div>
                    <button className="bg-white border border-gray-300 text-gray-600 font-bold px-4 py-2 rounded-xl text-sm shadow-sm">Configure</button>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-8 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2"><Lock className="w-5 h-5 text-duke-blue" /> Security Policies</h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm group hover:border-duke-blue/30 transition-colors">
                    <div className="max-w-md">
                      <h4 className="font-extrabold text-gray-800 flex items-center gap-2">Enforce 2FA for Admins</h4>
                      <p className="text-xs font-medium text-gray-500 mt-1 leading-relaxed">Require multi-factor authentication for accounts with root privileges.</p>
                    </div>
                    <div className="w-14 h-7 bg-green-500 rounded-full cursor-pointer relative shadow-inner shadow-green-700/50 transition-colors">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-1 right-1 shadow-md transition-transform"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm group hover:border-duke-blue/30 transition-colors">
                    <div className="max-w-md">
                      <h4 className="font-extrabold text-gray-800 flex items-center gap-2">Session Timeout</h4>
                      <p className="text-xs font-medium text-gray-500 mt-1 leading-relaxed">Automatically logout idle users after 120 minutes.</p>
                    </div>
                    <div className="w-14 h-7 bg-green-500 rounded-full cursor-pointer relative shadow-inner shadow-green-700/50 transition-colors">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-1 right-1 shadow-md transition-transform"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="animate-in fade-in zoom-in-95 duration-300 space-y-8">
              {/* API Integrations Mock */}
              <div className="glass-panel p-8 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-duke-blue" /> External Integrations</h3>

                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-800"></div>
                    <div className="flex justify-between items-center mb-4 ml-2">
                      <div>
                        <h4 className="font-extrabold text-gray-800 flex items-center gap-2">GitHub Enterprise Token</h4>
                        <p className="text-xs text-gray-500 font-medium mt-1">Used for syncing repositories and commit histories.</p>
                      </div>
                      <span className="bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-green-200">Connected</span>
                    </div>
                    <div className="flex gap-3 ml-2">
                      <input type="password" value="ghp_xxxxxxxxxxxxxxxxxxxxxxxx" readOnly className="flex-1 bg-gray-50 border border-gray-200 text-sm font-mono text-gray-600 px-4 py-2.5 rounded-xl shadow-inner focus:outline-none" />
                      <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors">Rotate Key</button>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600"></div>
                    <div className="flex justify-between items-center mb-4 ml-2">
                      <div>
                        <h4 className="font-extrabold text-gray-800 flex items-center gap-2">Canvas LMS Webhook URI</h4>
                        <p className="text-xs text-gray-500 font-medium mt-1">Target endpoint for grade passback.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 ml-2">
                      <input type="text" placeholder="https://duke.instructure.com/api/v1/..." className="flex-1 bg-white border border-gray-200 text-sm font-mono text-gray-800 px-4 py-2.5 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-duke-blue" />
                      <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors">Verify Endpoint</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-8 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2"><Lock className="w-5 h-5 text-duke-blue" /> Generate Access Token</h3>
                <p className="text-sm font-medium text-gray-500 mb-6">Create Personal Access Tokens (PATs) for programmatic API access.</p>

                <div className="flex gap-3 mb-6">
                  <input type="text" placeholder="Token Description (e.g. CI/CD Runner)" className="flex-1 bg-white border border-gray-200 text-sm font-medium text-gray-800 px-4 py-2.5 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-duke-blue" />
                  <button className="bg-duke-blue text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-duke-dark transition-colors">Generate</button>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Active Tokens</h4>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="font-bold text-gray-700 text-sm">Jenkins CI Main</span>
                    <button className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors">Revoke</button>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-bold text-gray-700 text-sm">Data Science Scraper</span>
                    <button className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors">Revoke</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="animate-in fade-in zoom-in-95 duration-300 space-y-8">
              <div className="glass-panel p-8 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-duke-blue" /> Permissions Matrix</h3>
                <p className="text-sm font-medium text-gray-500 mb-6">Fine-grained access control list per role category.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="py-4 text-xs font-extrabold text-gray-500 uppercase tracking-widest">Permission Scope</th>
                        <th className="py-4 text-center text-xs font-extrabold text-gray-500 uppercase tracking-widest w-20">Admin</th>
                        <th className="py-4 text-center text-xs font-extrabold text-gray-500 uppercase tracking-widest w-20">Faculty</th>
                        <th className="py-4 text-center text-xs font-extrabold text-gray-500 uppercase tracking-widest w-20">Client</th>
                        <th className="py-4 text-center text-xs font-extrabold text-gray-500 uppercase tracking-widest w-20">Student</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        { name: "Create Projects", a: true, f: true, c: true, s: false },
                        { name: "Edit Project Details", a: true, f: true, c: true, s: false },
                        { name: "Approve Client Proposals", a: true, f: true, c: false, s: false },
                        { name: "Assign Grades", a: true, f: true, c: false, s: false },
                        { name: "View Source Code", a: true, f: true, c: true, s: true },
                        { name: "Delete Student Repositories", a: true, f: true, c: false, s: false },
                        { name: "Manage Users", a: true, f: false, c: false, s: false },
                        { name: "Provision API Keys", a: true, f: false, c: false, s: false },
                        { name: "Manage Course Semesters", a: true, f: true, c: false, s: false },
                        { name: "Submit Feedback", a: true, f: true, c: true, s: false },
                        { name: "View Global Analytics", a: true, f: true, c: false, s: false },
                        { name: "Manage Billing & Invoices", a: true, f: false, c: false, s: false },
                        { name: "View Audit Logs", a: true, f: false, c: false, s: false },
                        { name: "Send Platform Announcements", a: true, f: true, c: false, s: false },
                        { name: "Manage System Configs", a: true, f: false, c: false, s: false },
                        { name: "Override Matchmaking Output", a: true, f: true, c: false, s: false },
                        { name: "View Hidden Portfolios", a: true, f: true, c: false, s: false },
                      ].map((p, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 font-bold text-sm text-gray-700">{p.name}</td>
                          <td className="py-4 text-center"><input type="checkbox" className="rounded text-duke-blue focus:ring-duke-blue border-gray-300" defaultChecked={p.a} disabled={p.a} /></td>
                          <td className="py-4 text-center"><input type="checkbox" className="rounded text-duke-blue focus:ring-duke-blue border-gray-300" defaultChecked={p.f} /></td>
                          <td className="py-4 text-center"><input type="checkbox" className="rounded text-duke-blue focus:ring-duke-blue border-gray-300" defaultChecked={p.c} /></td>
                          <td className="py-4 text-center"><input type="checkbox" className="rounded text-duke-blue focus:ring-duke-blue border-gray-300" defaultChecked={p.s} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end mt-6 pt-6 border-t border-gray-100">
                  <button className="bg-duke-blue text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-duke-dark transition-colors">Update Permissions</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="animate-in fade-in zoom-in-95 duration-300 space-y-8">
              {/* Danger Zone */}
              <div className="glass-panel p-8 rounded-3xl border border-red-100 bg-linear-to-b from-red-50/50 to-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                <h3 className="text-xl font-black text-red-600 mb-2 tracking-tight">Danger Zone</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-6">Actions here are irreversible.</p>

                <div className="space-y-4">
                  <div className="border border-red-200 rounded-2xl bg-white p-5 flex justify-between items-center shadow-sm">
                    <div>
                      <h4 className="font-extrabold text-gray-800">Purge Redis Cache</h4>
                      <p className="text-xs text-gray-500 mt-1">Force clear application cache. May cause temporary latency spike.</p>
                    </div>
                    <button className="bg-white border-2 border-red-200 text-red-600 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-red-50 hover:border-red-300 transition-all shadow-sm">Execute Purge</button>
                  </div>
                  <div className="border border-red-200 rounded-2xl bg-white p-5 flex justify-between items-center shadow-sm">
                    <div>
                      <h4 className="font-extrabold text-gray-800">Archive Semester Data</h4>
                      <p className="text-xs text-gray-500 mt-1">Move all current projects to read-only cold storage.</p>
                    </div>
                    <button className="bg-red-600 border border-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-red-700 transition-all shadow-md">Archive Now</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// --- FACULTY VIEWS ---
const FacultyHome = () => (
  <div className="space-y-8 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
    {/* Hero Banner */}
    <div className="relative overflow-hidden bg-linear-to-br from-indigo-800 via-[#012169] to-[#001A57] text-white p-10 md:p-12 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,26,87,0.5)] border border-blue-500/30 group hover-lift">
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent opacity-80"></div>
      <div className="absolute -right-20 -bottom-20 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000 ease-out">
        <Activity className="w-96 h-96" />
      </div>
      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold tracking-widest border border-white/20 mb-6 shadow-sm uppercase">
          Fall 2026 Semester
        </div>
        <h2 className="text-5xl md:text-6xl font-black mb-4 tracking-tighter drop-shadow-lg">CS 408 Capstone</h2>
        <p className="text-blue-200/90 font-medium text-lg md:text-xl leading-relaxed mb-8">
          You are managing <strong className="text-white">14 teams</strong> across <strong className="text-white">3 industry sponsors</strong>. Overall class trajectory is exceptionally positive.
        </p>
        <button className="bg-white text-duke-blue font-extrabold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all hover-scale">Download Grade Roster CSV</button>
      </div>
    </div>

    {/* Metrics Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="glass-panel p-8 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover-lift flex flex-col justify-between">
        <div className="flex justify-between items-start mb-6">
          <div className="bg-amber-100 p-3 rounded-2xl"><CheckCircle className="w-6 h-6 text-amber-600" /></div>
          <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-lg">High Priority</span>
        </div>
        <div>
          <p className="text-5xl font-black text-gray-800 tracking-tight mb-2">12</p>
          <h3 className="font-bold text-gray-500 uppercase tracking-widest">Submissions to Grade</h3>
        </div>
      </div>
      <div className="glass-panel p-8 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover-lift flex flex-col justify-between">
        <div className="flex justify-between items-start mb-6">
          <div className="bg-blue-100 p-3 rounded-2xl"><MessageSquare className="w-6 h-6 text-blue-600" /></div>
        </div>
        <div>
          <p className="text-5xl font-black text-gray-800 tracking-tight mb-2">5</p>
          <h3 className="font-bold text-gray-500 uppercase tracking-widest">Unread Messages</h3>
        </div>
      </div>
      <div className="glass-panel p-8 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover-lift flex flex-col justify-between">
        <div className="flex justify-between items-start mb-6">
          <div className="bg-green-100 p-3 rounded-2xl"><Star className="w-6 h-6 text-green-600" /></div>
          <span className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-2.5 py-1 rounded-lg">Above Target</span>
        </div>
        <div>
          <p className="text-5xl font-black text-gray-800 tracking-tight mb-2">A-</p>
          <h3 className="font-bold text-gray-500 uppercase tracking-widest">Class Average</h3>
        </div>
      </div>
    </div>
  </div>
);

const FacultyTeamsView = () => (
  <div className="space-y-8 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">My Teams</h2>
      <div className="flex gap-2">
        <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-gray-50 flex items-center gap-2 text-sm"><Settings className="w-4 h-4" /> Filter</button>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {[
        { name: "Delta", sponsor: "BlackRock", progress: 66, health: "Healthy", members: ["JD", "AB", "KW", "RS"] },
        { name: "Alpha", sponsor: "Microsoft", progress: 40, health: "At Risk", members: ["TC", "LL", "MJ"] },
        { name: "Omega", sponsor: "Lenovo", progress: 85, health: "Healthy", members: ["PO", "UY", "TT", "EQ"] },
        { name: "Sigma", sponsor: "Local Startup", progress: 20, health: "Critical", members: ["AA", "BB"] }
      ].map((team) => (
        <div key={team.name} className="glass-panel p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover-lift relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 transition-transform group-hover:scale-150 ${team.health === 'Healthy' ? 'bg-green-400' : team.health === 'At Risk' ? 'bg-amber-400' : 'bg-red-400'}`}></div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-gray-800 mb-1">Team {team.name}</h3>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> {team.sponsor}</p>
              </div>
              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm ${team.health === 'Healthy' ? 'bg-green-50 text-green-700 border-green-200' : team.health === 'At Risk' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {team.health}
              </span>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                <span>Sprint Progress</span>
                <span>{team.progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                <div className={`h-full rounded-full transition-all duration-1000 ${team.health === 'Healthy' ? 'bg-green-500' : team.health === 'At Risk' ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${team.progress}%` }}></div>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-gray-100 pt-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Members</p>
                <div className="flex -space-x-2 overflow-hidden">
                  {team.members.map(m => <div key={m} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-linear-to-br from-gray-200 to-gray-300 text-gray-600 font-bold flex items-center justify-center text-xs shadow-sm">{m}</div>)}
                </div>
              </div>
              <button className="bg-white border border-gray-200 text-duke-blue font-extrabold px-4 py-2.5 rounded-xl shadow-sm hover:border-duke-blue/30 transition-all text-sm flex items-center gap-2">View Board <Activity className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- CLIENT VIEWS ---
const ClientHome = () => (
  <div className="space-y-8 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/80 via-transparent to-transparent opacity-80 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-8">
        <div className="max-w-xl">
          <span className="text-xs font-bold uppercase tracking-widest text-duke-blue bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg mb-4 inline-block shadow-sm">Active Sponsorship</span>
          <h2 className="text-4xl font-black text-gray-800 mb-4 tracking-tight leading-tight">Duke Next-Gen Alpha Pipeline</h2>
          <p className="text-gray-500 text-lg leading-relaxed mb-6">Partnered with Team Delta to build an automated, AI-driven market intelligence aggregation system for high-frequency trading applications.</p>
          <div className="flex gap-4">
            <button className="bg-duke-blue text-white px-6 py-3 rounded-xl font-extrabold shadow-lg shadow-blue-900/20 hover:bg-duke-dark transition-all hover-lift">View Live Demo</button>
            <button className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-all">Project Repository</button>
          </div>
        </div>

        <div className="w-full md:w-auto shrink-0 flex gap-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center flex-1 hover-lift">
            <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-gray-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-duke-blue transition-all duration-1000 ease-out" strokeDasharray="66, 100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <span className="absolute text-xl font-black text-gray-800">66%</span>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Completion</p>
          </div>

          <div className="bg-linear-to-b from-gray-800 to-gray-900 p-6 rounded-3xl border border-gray-700 shadow-xl text-center flex-1 text-white hover-lift">
            <Activity className="w-8 h-8 mx-auto mb-4 text-blue-400" />
            <p className="text-3xl font-black mb-1">Oct 14</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Midterm Review</p>
          </div>
        </div>
      </div>
    </div>

    <div className="glass-panel p-8 rounded-[2.5rem] shadow-sm border border-white">
      <h3 className="font-extrabold text-xl text-gray-800 mb-8 tracking-tight flex items-center gap-2"><CheckCircle className="text-duke-blue w-6 h-6" /> Milestone Timeline</h3>
      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full"></div>
        <div className="absolute top-1/2 left-0 w-1/2 h-1 bg-duke-blue -translate-y-1/2 rounded-full shadow-[0_0_10px_rgba(0,26,87,0.5)]"></div>

        <div className="relative flex justify-between">
          {[
            { name: "Kickoff", status: "done", date: "Sep 1" },
            { name: "Requirements", status: "done", date: "Sep 15" },
            { name: "Midterm Prototype", status: "active", date: "Oct 14" },
            { name: "Final Delivery", status: "pending", date: "Dec 1" }
          ].map((ms, i) => (
            <div key={i} className="flex flex-col items-center group cursor-pointer">
              <div className={`w-8 h-8 rounded-full border-4 mb-4 flex items-center justify-center transition-transform group-hover:scale-125 shadow-md ${ms.status === 'done' ? 'bg-duke-blue border-duke-blue text-white' : ms.status === 'active' ? 'bg-white border-duke-blue text-duke-blue' : 'bg-white border-gray-200 text-transparent'}`}>
                {ms.status === 'done' && <CheckCircle className="w-4 h-4" />}
                {ms.status === 'active' && <div className="w-2.5 h-2.5 bg-duke-blue rounded-full animate-ping"></div>}
              </div>
              <h4 className={`font-bold text-sm ${ms.status === 'pending' ? 'text-gray-400' : 'text-gray-800'}`}>{ms.name}</h4>
              <p className="text-xs text-gray-500 font-medium mt-1">{ms.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ClientReviewView = () => (
  <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
    {/* Left side: Document Viewer Mock */}
    <div className="flex-1 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col">
      <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-lg text-red-600"><CheckCircle className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-gray-800">Midterm_Architecture_v2.pdf</h3>
            <p className="text-xs font-medium text-gray-500">2.4 MB • Uploaded Oct 10</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-800 bg-white p-2 rounded-lg border border-gray-200 shadow-sm transition-all"><MoreVertical className="w-5 h-5" /></button>
      </div>
      <div className="flex-1 bg-gray-100/50 p-8 overflow-y-auto flex items-center justify-center relative">
        <div className="bg-white w-full max-w-2xl h-full min-h-[600px] shadow-lg border border-gray-200 p-12 flex flex-col gap-6 scale-95 origin-top relative overflow-hidden">
          {/* Mock PDF Content */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 -translate-y-16 translate-x-16 rotate-45 border border-gray-100"></div>
          <h1 className="text-3xl font-black text-gray-800 border-b-2 border-gray-800 pb-4 w-3/4">System Architecture</h1>
          <div className="h-4 bg-gray-200 rounded-full w-full"></div>
          <div className="h-4 bg-gray-200 rounded-full w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded-full w-4/6"></div>
          <div className="mt-8 h-64 border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl flex items-center justify-center text-blue-400 font-bold uppercase tracking-widest">[ DIAGRAM FIGURE 1 ]</div>
          <div className="h-4 bg-gray-200 rounded-full w-full mt-8"></div>
          <div className="h-4 bg-gray-200 rounded-full w-11/12"></div>
          <div className="h-4 bg-gray-200 rounded-full w-full"></div>
        </div>
      </div>
    </div>

    {/* Right side: Feedback Thread */}
    <div className="w-full md:w-96 flex flex-col gap-6 shrink-0">
      <div className="glass-panel p-6 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex-1 flex flex-col">
        <h3 className="font-extrabold text-xl text-gray-800 mb-6 tracking-tight flex items-center gap-2"><MessageSquare className="w-5 h-5 text-duke-blue" /> Feedback Thread</h3>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative">
            <div className="absolute -left-2 -top-2 w-6 h-6 rounded-full bg-duke-blue text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white">BR</div>
            <h4 className="font-bold text-sm text-gray-800 ml-3">BlackRock Sponsor</h4>
            <p className="text-sm text-gray-600 mt-2">The architecture looks solid. I noticed you opted for Postgres over Mongo for the events DB. Can you clarify the reasoning in the final report?</p>
            <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wider">Oct 11, 2:30 PM</p>
          </div>

          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 shadow-sm ml-6 relative">
            <div className="absolute -left-2 -top-2 w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white">TD</div>
            <h4 className="font-bold text-sm text-gray-800 ml-3">Team Delta</h4>
            <p className="text-sm text-gray-600 mt-2">Absolutely. We tested throughput for structured writes and Postgres partitioned tables gave us a 15% edge. We will document this.</p>
            <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wider">Oct 11, 4:15 PM</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 mt-auto">
          <textarea className="w-full p-4 border border-gray-200 rounded-2xl mb-4 focus:ring-2 focus:ring-duke-blue outline-none text-sm shadow-inner bg-gray-50/50 resize-none transition-shadow" rows={4} placeholder="Leave an official review comment..."></textarea>
          <div className="flex gap-3">
            <button className="flex-1 bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-600 hover:-translate-y-0.5 transition-all">Approve</button>
            <button className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl shadow-sm hover:bg-gray-50 transition-all">Request Edits</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- GUEST VIEWS ---
const GuestHome = () => (
  <div className="space-y-12 mt-4 pb-12 animate-in fade-in duration-700">
    {/* Massive Hero Section */}
    <div className="relative overflow-hidden bg-white text-center py-24 md:py-32 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100 group">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white pointer-events-none"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 mix-blend-multiply transition-transform duration-1000 group-hover:scale-150"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50 mix-blend-multiply transition-transform duration-1000 group-hover:scale-150"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-bold text-duke-blue tracking-widest uppercase mb-8 hover-scale cursor-pointer">
          <Star className="w-4 h-4" /> Showcase 2026
        </span>
        <h2 className="text-6xl md:text-8xl font-black text-gray-900 mb-8 tracking-tighter leading-tight drop-shadow-sm">
          Engineering the <span className="text-transparent bg-clip-text bg-linear-to-r from-duke-blue to-indigo-600">Future.</span>
        </h2>
        <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed mb-12">
          Explore outstanding, production-ready systems created by Duke University students in collaboration with leading industry partners.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-duke-blue text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 hover:bg-duke-dark transition-all hover-lift">Explore Projects</button>
          <button className="bg-white border-2 border-gray-200 text-gray-800 px-8 py-4 rounded-2xl font-bold text-lg shadow-sm hover:border-gray-300 hover:bg-gray-50 transition-all">Become a Sponsor</button>
        </div>
      </div>
    </div>

    {/* Breathtaking Masonry Grid Mock */}
    <div className="px-4">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-3xl font-black text-gray-800 tracking-tight">Featured Portfolios</h3>
          <p className="text-gray-500 font-medium mt-2">Filter by domain, technology, or sponsor.</p>
        </div>
        <div className="hidden md:flex gap-2">
          {["All", "FinTech", "Health", "AI/ML"].map((tag, i) => (
            <button key={tag} className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${i === 0 ? 'bg-gray-800 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'}`}>{tag}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { title: "Algorithmic Trading Bot", sponsor: "BlackRock", desc: "A high-frequency Rust pipeline.", tech: ["Rust", "React", "AWS"] },
          { title: "MedRecord Sync API", sponsor: "Duke Health", desc: "HIPAA-compliant data mesh.", tech: ["Python", "GraphQL", "Postgres"] },
          { title: "Supply Chain Insights", sponsor: "Lenovo", desc: "Predictive analytics dashboard.", tech: ["Next.js", "Python", "TensorFlow"] },
          { title: "Autonomous Drone Nav", sponsor: "Defense Co", desc: "Computer vision pathfinding.", tech: ["C++", "OpenCV", "ROS"] },
          { title: "Crypto Wallet Core", sponsor: "Web3 Startup", desc: "Zero-knowledge proof integration.", tech: ["Solidity", "Node.js", "ZK-SNARKs"] },
          { title: "Urban Traffic Modeling", sponsor: "City Gov", desc: "Real-time congestion simulation.", tech: ["Go", "React", "Kafka"] }
        ].map((proj, i) => (
          <div key={i} className="group bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden hover-lift flex flex-col relative">
            <div className="absolute inset-0 bg-linear-to-b from-transparent to-white/90 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
              <button className="w-full bg-duke-blue text-white font-black py-4 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300">View Full Case Study</button>
            </div>

            <div className={`h-48 w-full relative overflow-hidden bg-linear-to-br ${i % 2 === 0 ? 'from-indigo-100 to-blue-50' : 'from-blue-50 to-cyan-100'}`}>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4xKSIvPjwvc3ZnPg==')] opacity-50"></div>
              <div className="absolute bottom-4 left-4">
                <span className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest text-duke-blue shadow-sm border border-white/50">{proj.sponsor}</span>
              </div>
            </div>
            <div className="p-8 flex-1 flex flex-col justify-between relative z-0">
              <div>
                <h3 className="font-black text-2xl text-gray-800 mb-3 tracking-tight group-hover:text-duke-blue transition-colors">{proj.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed mb-6">{proj.desc}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {proj.tech.map(t => <span key={t} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-xs font-bold">{t}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// --- STUDENT CHAT VIEW ---
const StudentChatView = () => (
  <div className="h-[calc(100vh-8rem)] flex mt-4 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">

    {/* Left Sidebar Channels */}
    <div className="w-72 bg-gray-50 border-r border-gray-200 hidden lg:flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-black text-gray-800 tracking-tight">Project Comms</h2>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">Sponsor Channels</p>
          <div className="space-y-1">
            <button className="w-full text-left px-3 py-2.5 rounded-xl bg-blue-50 text-duke-blue font-extrabold flex justify-between items-center shadow-sm">
              <span># blackrock-general</span>
              <span className="bg-duke-blue text-white text-[10px] px-1.5 py-0.5 rounded-md">3</span>
            </button>
            <button className="w-full text-left px-3 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors"># technical-support</button>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">Team Delta</p>
          <div className="space-y-1">
            <button className="w-full text-left px-3 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors"># internal-chat</button>
            <button className="w-full text-left px-3 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors"># github-commits</button>
          </div>
        </div>
      </div>
    </div>

    {/* Main Chat Area */}
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-gray-800 to-black text-white flex items-center justify-center font-black text-lg mr-4 shadow-md">BR</div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-gray-800">BlackRock Sponsor Team</h3>
            <p className="text-xs text-gray-500 font-medium">3 members online</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"><Bell className="w-5 h-5" /></button>
          <button className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"><Settings className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 space-y-8">
        <div className="text-center my-6 relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <div className="relative flex justify-center"><span className="bg-slate-50 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Today</span></div>
        </div>

        <div className="flex justify-start">
          <div className="w-8 h-8 rounded-full bg-gray-300 mr-3 shrink-0 flex items-center justify-center text-xs font-bold text-white mt-1">S</div>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-extrabold text-sm text-gray-800">Sarah (Sponsor)</span>
              <span className="text-[10px] font-bold text-gray-400">10:00 AM</span>
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 max-w-lg">
              <p className="text-sm text-gray-700 leading-relaxed">Hi Team Delta, any updates on the ML pipeline deployment? We are preparing the testing environment on our end.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <div>
            <div className="flex items-baseline justify-end gap-2 mb-1">
              <span className="text-[10px] font-bold text-gray-400">10:15 AM</span>
              <span className="font-extrabold text-sm text-duke-blue">You</span>
            </div>
            <div className="bg-duke-blue text-white p-4 rounded-2xl rounded-tr-none shadow-md max-w-lg">
              <p className="text-sm leading-relaxed mb-3">We're pushing the first staging build today! Here is a sneak peek at the configuration file we are using for the initial run.</p>
              {/* Rich Attachment Mock */}
              <div className="bg-black/20 rounded-xl p-3 border border-white/10 flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg"><Activity className="w-5 h-5 text-blue-200" /></div>
                <div>
                  <p className="text-xs font-bold">staging-config.yaml</p>
                  <p className="text-[10px] text-blue-200/70">YAML • 4 KB</p>
                </div>
              </div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-duke-blue ml-3 shrink-0 flex items-center justify-center text-xs font-bold text-white mt-1 border-2 border-white shadow-sm">You</div>
        </div>
      </div>

      {/* Chat Input */}
      <div className="p-4 md:p-6 bg-white border-t border-gray-100">
        <div className="flex items-end gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-2 shadow-inner focus-within:ring-2 focus-within:ring-duke-blue focus-within:border-duke-blue transition-all">
          <button className="p-3 text-gray-400 hover:text-duke-blue rounded-xl transition-colors shrink-0"><Plus className="w-5 h-5" /></button>
          <textarea className="flex-1 max-h-32 p-3 bg-transparent border-none focus:outline-none text-sm resize-none" rows={1} placeholder="Message #blackrock-general..."></textarea>
          <button className="bg-duke-blue text-white p-3 rounded-xl shadow-md hover:bg-duke-dark transition-colors shrink-0 flex items-center justify-center"><CheckCircle className="w-5 h-5" /></button>
        </div>
        <p className="text-[10px] text-gray-400 font-medium text-center mt-3"><strong>Return</strong> to send, <strong>Shift + Return</strong> for new line.</p>
      </div>
    </div>
  </div>
);



// --- APP ENTRY ---
export default function App() {
  const [role, setRole] = useState<Role>("Student"); // Default to student
  const githubData = useGithubRepoData();

  return (
    <Router>
      <div className="min-h-screen bg-[#f8fafc] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-gray-50/20 to-[#f8fafc] flex flex-col font-sans text-gray-900 selection:bg-duke-blue selection:text-white">
        <Navbar role={role} setRole={setRole} />
        <div className="max-w-[1440px] w-full mx-auto flex flex-1 overflow-hidden lg:px-4">
          <Sidebar role={role} />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 md:pl-10 scroll-smooth">
            <MockPageRouter role={role} githubData={githubData} />
          </main>
        </div>
      </div>
    </Router>
  );
}
