import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { useTradingContext } from "@/contexts/TradingContext";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight,
  LayoutDashboard,
  BarChart3,
  FileInput,
  Plus,
  Users,
  MenuIcon,
  BellIcon,
  User,
  ChevronLeft,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const { programRunning, toggleProgramState, isLoading } = useTradingContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  // On mobile, sidebar is hidden by default
  React.useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Get current page title based on the route
  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/detailed-metrics":
        return "Detailed Metrics";
      case "/inputs":
        return "Input Configuration";
      case "/manual":
        return "Manual Order Placement";
      case "/accounts":
        return "Account Management";
      default:
        return "Trading Platform";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out 
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:relative lg:inset-0 lg:translate-x-0 bg-white dark:bg-gray-800 border-r dark:border-gray-700`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-5 border-b dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
                <BarChart3 size={20} />
              </div>
              <span className="text-lg font-semibold">Trading Platform</span>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
              aria-label="Close sidebar"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <ul className="space-y-1">
              <li>
                <Link href="/"
                  className={`flex items-center px-4 py-3 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 
                    ${
                      location === "/"
                        ? "bg-primary-50 text-primary-600 dark:bg-gray-700"
                        : ""
                    }`}
                >
                  <LayoutDashboard className="w-5 h-5 mr-3" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/detailed"
                  className={`flex items-center px-4 py-3 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 
                    ${
                      location === "/detailed"
                        ? "bg-primary-50 text-primary-600 dark:bg-gray-700"
                        : ""
                    }`}
                >
                  <BarChart3 className="w-5 h-5 mr-3" />
                  Detailed Metrics
                </Link>
              </li>
              <li>
                <Link href="/inputs"
                  className={`flex items-center px-4 py-3 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 
                    ${
                      location === "/inputs"
                        ? "bg-primary-50 text-primary-600 dark:bg-gray-700"
                        : ""
                    }`}
                >
                  <FileInput className="w-5 h-5 mr-3" />
                  Inputs
                </Link>
              </li>
              <li>
                <Link href="/manual"
                  className={`flex items-center px-4 py-3 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 
                    ${
                      location === "/manual"
                        ? "bg-primary-50 text-primary-600 dark:bg-gray-700"
                        : ""
                    }`}
                >
                  <Plus className="w-5 h-5 mr-3" />
                  Manual Orders
                </Link>
              </li>
              <li>
                <Link href="/accounts"
                  className={`flex items-center px-4 py-3 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 
                    ${
                      location === "/accounts"
                        ? "bg-primary-50 text-primary-600 dark:bg-gray-700"
                        : ""
                    }`}
                >
                  <Users className="w-5 h-5 mr-3" />
                  Accounts
                </Link>
              </li>
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <span className="text-sm font-medium">Admin</span>
              </div>

              {/* Dark Mode Toggle */}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mr-4 focus:outline-none"
                  aria-label="Toggle sidebar"
                >
                  <MenuIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm">
                  <span className="font-semibold">Status:</span>
                  {isLoading ? (
                    <Skeleton className="h-4 w-16 inline-block ml-2" />
                  ) : (
                    <span
                      className={`${
                        programRunning
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {" "}
                      {programRunning ? "Running" : "Stopped"}
                    </span>
                  )}
                </span>

                <Button
                  onClick={toggleProgramState}
                  disabled={isLoading}
                  variant="default"
                  className={`${
                    programRunning
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {isLoading ? (
                    <Skeleton className="h-4 w-20" />
                  ) : programRunning ? (
                    "Stop Program"
                  ) : (
                    "Start Program"
                  )}
                </Button>

                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <BellIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-4">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
