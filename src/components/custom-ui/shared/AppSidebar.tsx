"use client";
import * as React from "react";
import {
  ChevronRight,
  LogOut,
  ChevronsUpDown,
  Users,
  Grip,
  Signal,
  Archive,
  Video,
  FileText,
  Layers,
  BrainCircuit,
  Library,
  MonitorPlay,
  FileQuestion,
  Radio,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import { customLogout } from "@/utils/logoutUtils";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define the type for navigation items to include roles
interface NavItem {
  title: string;
  url: string;
  icon?: React.ElementType;
  roles?: string[]; // Added roles array
  items?: NavItem[];
}

export function AppSidebar() {
  const pathname = usePathname();
  const session = useSession();
  
  // Adjust these accessors based on your actual NextAuth session structure
  // Based on your code: session.data?.user?.user?.employee_data
  const user = session.data?.user; 
  // @ts-ignore - Assuming 'user' property exists inside session user object based on your snippet
  const userData = user?.user || {}; 
  const userRoles = userData.roles || []; // Array of strings e.g. ['Admin']
  const isStudent = !!userData.child_id; // Check if child_id exists
  const isEmployee = userData.employee_data;

  // --- 1. DEFINITION WITH ROLES ---
  // We wrap this in useMemo so it doesn't redefine on every render, 
  // though strictly not necessary for static data.
  const rawNavItems: NavItem[] = React.useMemo(() => [
    { 
      title: "Worksheets", 
      url: "/worksheet", 
      icon: FileQuestion,
      roles: ['excludeStudent']
    },
    { 
      title: "E-Lessons", 
      url: "/templates", 
      icon: MonitorPlay,
      roles: ['excludeStudent']
    },
    { 
      title: "Resources", 
      url: "/resources", 
      icon: Library,
      roles: [] // Accessible by all
    },
    { 
      title: "MM Live", 
      url: "/mm-live", 
      icon: Radio,
      roles: [] // Accessible by all
    },
    {
      title: "Revision Word Problems",
      url: "/revision-word-problems",
      icon: BrainCircuit,
      roles: ['excludeStudent']
    },
    { 
      title: "Topics", 
      url: "/topics", 
      icon: Layers,
      roles: ['Admin','Principal']
    },
    { 
      title: "Levels", 
      url: "/levels", 
      icon: Signal,
      roles: ['Admin','Principal']
    },
    { 
      title: "Classes", 
      url: "/classes", 
      icon: Users,
      roles: ['Admin','Principal']
    },
    {
      title: "Archive",
      url: "#", // Parent item often doesn't have a direct link
      icon: Archive,
      roles: ['excludeStudent'],
      items: [
        { title: "E-lessons", url: "/archive-lessons", icon: Video },
        { title: "Worksheets", url: "/archive-worksheets", icon: FileText },
      ],
    },
  ], []);

  // --- 2. PERMISSION LOGIC ---
  // Mirrors the isAllowed() logic from your Vue component
  const checkPermission = React.useCallback((item: NavItem) => {
    // If no roles defined or empty array, everyone can see it
    if (!item.roles || item.roles.length === 0) {
      return true;
    }

    // Logic for Student (child_id exists)
    if (isStudent) {
      // If the user is a student, and roles exist, they are generally blocked
      // unless logic dictates otherwise. 
      // However, looking at your Vue code, if 'excludeStudent' is present, it explicitly blocks students.
      // If the item has strict roles like ['Admin'], students obviously can't see it.
      return false; 
    }

    // Logic for Non-Students (Teachers/Admins/Principals)
    if (!isStudent) {
      // If the only restriction is "excludeStudent", allow all non-students
      if (item.roles.includes('excludeStudent')) {
        return true;
      }

      // Check specific roles (e.g., 'Admin', 'Principal')
      // If the item requires specific roles, the user must have at least one of them
      const hasMatchingRole = item.roles.some((role) => 
        userRoles.includes(role)
      );

      return hasMatchingRole;
    }

    return false;
  }, [isStudent, userRoles]);

  // --- 3. FILTERING ---
  const navItems = React.useMemo(() => {
    return rawNavItems.filter(item => checkPermission(item));
  }, [rawNavItems, checkPermission]);

  return (
    <Sidebar
      variant="sidebar"
      collapsible="offcanvas"
      style={{ "--sidebar-width": "280px" } as React.CSSProperties}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="peer hover:bg-slate-50 transition-colors h-auto py-3"
                >
                  <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-white peer-hover:bg-[#00b6dd] text-white shrink-0">
                    <Grip className="size-5 text-primary peer-hover:text-white" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-tight text-left ml-2">
                    <span className="font-bold text-[#005669] text-sm">
                      Math Mavens Inc.
                    </span>
                    <span className="text-[10px] opacity-60 font-medium uppercase tracking-wider whitespace-normal line-clamp-1">
                      {isEmployee
                        ? isEmployee.branch?.name
                        : "Global Administrator"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 opacity-40 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest mb-2">
            Internal Systems
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              {navItems.map((item) => {
                const isChildActive = item.items?.some(
                  (child) => pathname === child.url
                );
                
                // Handle Collapsible Groups (like Archive)
                if (item.items) {
                  return (
                    <Collapsible
                      key={item.title}
                      asChild
                      defaultOpen={isChildActive}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            className={`hover:bg-slate-50 h-auto py-2.5 items-start`}
                          >
                            {item.icon && (
                              <item.icon className="size-4 mt-0.5 shrink-0" />
                            )}
                            <span className="font-semibold text-sm leading-tight ml-2 whitespace-normal break-words">
                              {item.title}
                            </span>
                            <ChevronRight className="ml-auto size-4 mt-0.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 shrink-0" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub className="border-l border-slate-100 ml-4 pl-2 mr-2">
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={pathname === subItem.url}
                                  className="h-auto py-2 items-start"
                                >
                                  <Link
                                    href={subItem.url}
                                    className="text-[13px] font-medium leading-tight whitespace-normal break-words block w-full"
                                  >
                                    {subItem.title}
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                // Handle Standard Links
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={pathname === item.url}
                      className={`h-auto py-2.5 items-start`}
                    >
                      <Link href={item.url}>
                        {item.icon && (
                          <item.icon className="size-4 mt-0.5 shrink-0" />
                        )}
                        <span className="font-semibold text-sm leading-tight ml-2 whitespace-normal break-words">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => customLogout()}
              className="w-full justify-start text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors h-11"
            >
              <LogOut className="size-4 mr-2 shrink-0" />
              <span className="font-bold uppercase text-[11px] tracking-wider">
                Sign Out
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}