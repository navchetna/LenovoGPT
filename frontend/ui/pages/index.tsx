'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Box } from '@mui/material';
import { ApiType } from '@/types/api';
import Navbar from '@/components/Navbar';
import Navbar_admin from '@/components/Navbar_admin';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';
import ChatArea from '@/components/ChatArea';
import FileManagerPage from '@/components/DocumentFileManager';
import SearchLanding from '@/components/SearchLanding';
import SearchResults from '@/components/SearchResults';
import LandingPage from '@/components/LandingPage_Admin';
import AdminLandingPage from '@/components/LandingPage';
import LoginForm from '@/components/LoginForm';

// Updated interfaces to match backend response
interface User {
  id: string;
  name: string;
  email: string;
  departments: string[];
  role: string;
  status: string;
  created_at: string;
}

interface LoginResponse {
  message: string;
  token: string;
  user: User;
  userType: 'admin' | 'user';
}

const Home: React.FC = () => {
  const [currentContext, setCurrentContext] = useState<string>('General');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const { messages, isLoading, error } = useChat();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPDFViewerOpen, setIsPDFViewerOpen] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [selectedApi, setSelectedApi] = useState<ApiType>("semantic_scholar");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Authentication states - updated to use backend data
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'admin' | 'user' | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Check authentication status on component mount
  useEffect(() => {
    const loginStatus = localStorage.getItem('isLoggedIn');
    const authStatus = localStorage.getItem('isAuthenticated');
    const department = localStorage.getItem('department');
    const userData = localStorage.getItem('userData');
    const savedUserType = localStorage.getItem('userType');
    const token = localStorage.getItem('authToken');
    
    if (loginStatus === 'true' && token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setIsLoggedIn(true);
        setCurrentUser(parsedUser);
        setUserType(savedUserType as 'admin' | 'user');
        setAuthToken(token);
        
        if (authStatus === 'true' && department) {
          setIsAuthenticated(true);
          setCurrentDepartment(department);
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear corrupted data
        localStorage.clear();
      }
    }
  }, []);

  // Handle login form submission - updated to work with backend
  const handleLogin = (response: LoginResponse) => {
    try {
      setUserType(response.userType);
      setIsLoggedIn(true);
      setCurrentUser(response.user);
      setAuthToken(response.token);
      
      // Store in localStorage for persistence
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userData', JSON.stringify(response.user));
      localStorage.setItem('userType', response.userType);
      localStorage.setItem('authToken', response.token);
      
    } catch (error) {
      console.error('Error handling login response:', error);
      // Handle login error - could show error message to user
    }
  };

  // Handle department selection from landing page
  const handleDepartmentAuthentication = (department: string, user: string) => {
    setIsAuthenticated(true);
    setCurrentDepartment(department);
    
    // Store in localStorage for persistence
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('department', department);
  };

  // Handle going back to landing page (department selection)
  const handleGoBackToLanding = () => {
    // Reset authentication but keep login status
    setIsAuthenticated(false);
    setCurrentDepartment('');
    
    // Clear department-specific localStorage but keep login info
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('department');
    
    // Reset other application states
    setSelectedConversation(null);
    setIsSearchOpen(false);
    setSearchResults(null);
  };

  const handleLogout = () => {
    // Reset all authentication states
    setIsLoggedIn(false);
    setIsAuthenticated(false);
    setCurrentDepartment('');
    setCurrentUser(null);
    setUserType(null);
    setAuthToken(null);
    
    // Clear localStorage
    localStorage.clear();
    
    // Reset other states
    setSelectedConversation(null);
    setIsSearchOpen(false);
    setSearchResults(null);
  };

  const handleTogglePDFViewer = () => {
    setIsPDFViewerOpen(!isPDFViewerOpen);
  };

  const handleToggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchResults(null);
    }
  };

  const handleSearch = (results: any[], api: ApiType, query: string) => {
    setSearchResults(results);
    setSelectedApi(api);
    setSearchQuery(query);
    setIsSearchOpen(true);
  };

  const handleSidebarCollapse = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  const handleConversationUpdated = () => {
    setRefreshCounter(prev => prev + 1);
  };

  // Step 1: Show login form if not logged in
  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Step 2: Show appropriate landing page based on user type
  if (!isAuthenticated) {
    return userType === 'admin' 
      ? <AdminLandingPage onAuthenticated={handleDepartmentAuthentication} onLogout={handleLogout} />
      // : <LandingPage onAuthenticated={handleDepartmentAuthentication} onLogout={handleLogout} />;
      : <LandingPage onAuthenticated={handleDepartmentAuthentication} onLogout={handleLogout} user={currentUser || undefined} />
  }

  // Step 3: Show main application if both logged in and department selected
  const leftSidebarWidth = isSidebarCollapsed ? 60 : 300;
  const rightSidebarWidth = 76;

  // Update authenticatedUser with current user info from backend
  const authenticatedUser = currentUser ? {
    name: currentUser.name,
    email: currentUser.email,
    avatarUrl: '/placeholder.svg',
    department: currentDepartment,
    role: currentUser.role,
    departments: currentUser.departments
  } : {
    name: 'Unknown User',
    email: 'unknown@lenovo.com',
    avatarUrl: '/placeholder.svg',
    department: currentDepartment
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {userType === 'admin' ? (
        <Navbar_admin
          user={authenticatedUser}
          onLogout={handleLogout}
          onGoBack={handleGoBackToLanding}
        />
      ) : (
        <Navbar
          user={authenticatedUser}
          onLogout={handleLogout}
          onGoBack={handleGoBackToLanding}
        />
      )}

      <Box
        sx={{
          backgroundColor: 'aliceblue',
          display: 'flex',
          flexGrow: 1,
          pt: '64px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Only show LeftSidebar for regular users (not admin) and when search is not open */}
        {!isSearchOpen && userType !== 'admin' && (
          <LeftSidebar
            onSelectConversation={setSelectedConversation}
            selectedConversation={selectedConversation}
            isCollapsed={isSidebarCollapsed}
            onCollapseChange={handleSidebarCollapse}
            refreshTrigger={refreshCounter}
          />
        )}
        <Box
          component="main"
          sx={{
            position: 'fixed',
            // For admin users, start from left edge (0), for regular users use sidebar width
            left: isSearchOpen ? 0 : (userType === 'admin' ? 0 : leftSidebarWidth),
            right: rightSidebarWidth,
            top: '64px',
            bottom: 0,
            transition: 'left 0.3s ease-in-out',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: '1700px',
              mx: 'auto',
              position: 'relative',
            }}
          >
            {isSearchOpen ? (
              searchResults ? (
                <SearchResults 
                  results={searchResults} 
                  api={selectedApi}
                  query={searchQuery}
                  onSearch={handleSearch}
                />
              ) : (
                <SearchLanding onSearch={handleSearch} />
              )
            ) : (
              // Conditional rendering based on user type
              userType === 'admin' ? (
                <FileManagerPage />
              ) : (
                <ChatArea
                  conversationId={selectedConversation}
                  onTogglePDFViewer={handleTogglePDFViewer}
                  isPDFViewerOpen={isPDFViewerOpen}
                  isCollapsed={isSidebarCollapsed}
                  onCollapseChange={handleSidebarCollapse}
                  onContextChange={setCurrentContext}
                  onSelectConversation={setSelectedConversation}
                  onConversationUpdated={handleConversationUpdated}
                  updateConversationList={() => setRefreshCounter(prev => prev + 1)}
                  currentDepartment={currentDepartment}
                  currentUser={currentUser}
                />
              )
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Home;