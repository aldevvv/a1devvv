'use client';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useState, useCallback, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Save, 
  Eye, 
  EyeOff, 
  Shield, 
  AlertCircle, 
  CheckCircle,
  Upload,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface EmailFormData {
  newEmail: string;
  currentPassword: string;
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  
  // State management
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Profile picture state
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    username: user?.username || ''
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Email form state
  const [emailForm, setEmailForm] = useState<EmailFormData>({
    newEmail: user?.email || '',
    currentPassword: ''
  });

  // Update profile form when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        username: user.username || ''
      });
    }
  }, [user]);

  // Check if user has password (not OAuth-only)
  const hasPassword = user?.googleId || user?.githubId ? false : true;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle profile image upload with compression
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB');
        return;
      }
      
      // Compress and process image
      compressImage(file)
        .then(compressedFile => {
          setProfileImage(compressedFile);
          
          // Create preview
          const reader = new FileReader();
          reader.onload = (e) => {
            setProfileImagePreview(e.target?.result as string);
          };
          reader.readAsDataURL(compressedFile);
        })
        .catch(error => {
          console.error('Image compression failed:', error);
          toast.error('Failed to process image');
        });
    }
  }, []);

  // Image compression function
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 800x800, maintain aspect ratio)
        let { width, height } = img;
        const maxDimension = 800;
        
        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          'image/jpeg',
          0.8 
        );
      };
      
      img.onerror = () => reject(new Error('Image loading failed'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle profile image save
  const handleSaveProfileImage = async () => {
    if (!profileImage) return;
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', profileImage);
      
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/user/profile-image`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        toast.success('Profile picture updated successfully');
        setProfileImage(null);
        setProfileImagePreview('');
        await refreshUser();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update profile picture');
      }
    } catch (error) {
      toast.error('Failed to update profile picture');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileForm.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    
    if (!profileForm.username.trim()) {
      toast.error('Username is required');
      return;
    }
    
    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(profileForm.username)) {
      toast.error('Username must be 3-20 characters long and contain only letters, numbers, underscores, or hyphens');
      return;
    }
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/user/update-profile`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success('Profile updated successfully');
        await refreshUser();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email change
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailForm.newEmail || emailForm.newEmail === user?.email) {
      toast.error('Please enter a new email address');
      return;
    }
    
    if (!hasPassword && !emailForm.currentPassword) {
      toast.error('Current password is required');
      return;
    }
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/user/change-email`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          newEmail: emailForm.newEmail,
          currentPassword: hasPassword ? emailForm.currentPassword : undefined
        })
      });
      
      if (response.ok) {
        toast.success('Email change verification sent to your new email');
        setEmailForm({ newEmail: '', currentPassword: '' });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to change email');
      }
    } catch (error) {
      toast.error('Failed to change email');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change/create
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    if (hasPassword && !passwordForm.currentPassword) {
      toast.error('Current password is required');
      return;
    }
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const endpoint = hasPassword ? '/user/change-password' : '/user/create-password';
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: hasPassword ? passwordForm.currentPassword : undefined,
          newPassword: passwordForm.newPassword
        })
      });
      
      if (response.ok) {
        toast.success(hasPassword ? 'Password changed successfully' : 'Password created successfully');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        await refreshUser();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update password');
      }
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Security', icon: Lock }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      {/* Settings Content */}
      <div className={`rounded-lg border ${
        theme === 'dark' 
          ? 'bg-gray-900 border-gray-800' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Tabs */}
        <div className={`border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : `border-transparent ${
                          theme === 'dark' 
                            ? 'text-gray-400 hover:text-gray-300' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Profile Picture</h3>
                
                <div className="flex items-center space-x-6">
                  {/* Current/Preview Image */}
                  <div className="relative">
                    {profileImagePreview || user?.profileImage ? (
                      <img
                        src={profileImagePreview || user?.profileImage}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center text-lg font-medium ${
                        theme === 'dark'
                          ? 'bg-neon-blue text-background'
                          : 'bg-primary text-primary-foreground'
                      }`}>
                        {getInitials(user?.fullName || user?.email || 'User')}
                      </div>
                    )}
                    
                    {profileImagePreview && (
                      <button
                        onClick={() => {
                          setProfileImage(null);
                          setProfileImagePreview('');
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium cursor-pointer transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-800 text-white hover:bg-gray-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>
                        <Camera className="w-4 h-4 mr-2" />
                        Choose Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    
                    {profileImage && (
                      <button
                        onClick={handleSaveProfileImage}
                        disabled={isLoading}
                        className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Photo
                      </button>
                    )}
                    
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      JPG, PNG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Information */}
              <div>
                <h3 className="text-lg font-medium mb-4">Profile Information</h3>
                
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                        theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter your full name"
                      maxLength={100}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Username
                    </label>
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value.toLowerCase() }))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                        theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter username (3-20 characters)"
                      minLength={3}
                      maxLength={20}
                    />
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Only letters, numbers, underscores, and hyphens allowed
                    </p>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Update Profile
                  </button>
                </form>
              </div>

              {/* Account Information */}
              <div className={`border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} pt-6`}>
                <h3 className="text-lg font-medium mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Email Address
                    </label>
                    <div className={`px-3 py-2 border rounded-md ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}>
                      {user?.email}
                    </div>
                  </div>

                  {/* OAuth Indicators */}
                  {(user?.googleId || user?.githubId) && (
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Connected Accounts
                      </label>
                      <div className="space-y-2">
                        {user?.googleId && (
                          <div className={`flex items-center px-3 py-2 border rounded-md ${
                            theme === 'dark'
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-gray-50 border-gray-300'
                          }`}>
                            <div className="w-4 h-4 mr-2 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              G
                            </div>
                            Google Account
                          </div>
                        )}
                        {user?.githubId && (
                          <div className={`flex items-center px-3 py-2 border rounded-md ${
                            theme === 'dark'
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-gray-50 border-gray-300'
                          }`}>
                            <div className="w-4 h-4 mr-2 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              G
                            </div>
                            GitHub Account
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Email Settings</h3>
                
                <div className={`mb-4 p-4 rounded-lg border ${
                  user?.emailVerifiedAt 
                    ? theme === 'dark' 
                      ? 'bg-green-900/20 border-green-800 text-green-300'
                      : 'bg-green-50 border-green-200 text-green-700'
                    : theme === 'dark'
                      ? 'bg-yellow-900/20 border-yellow-800 text-yellow-300'  
                      : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                }`}>
                  <div className="flex items-center">
                    {user?.emailVerifiedAt ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-2" />
                    )}
                    <span className="text-sm font-medium">
                      {user?.emailVerifiedAt ? 'Email Verified' : 'Email Not Verified'}
                    </span>
                  </div>
                  <p className="text-sm mt-1">
                    Current email : {user?.email}
                  </p>
                </div>

                <form onSubmit={handleEmailChange} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      New Email Address
                    </label>
                    <input
                      type="email"
                      value={emailForm.newEmail}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                        theme === 'dark' 
                          ? 'bg-gray-800 border-gray-700 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter new email address"
                    />
                  </div>
                  
                  {hasPassword && (
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={emailForm.currentPassword}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                          theme === 'dark' 
                            ? 'bg-gray-800 border-gray-700 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Enter current password"
                      />
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Change Email
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">
                  {hasPassword ? 'Change Password' : 'Create Password'}
                </h3>
                
                {!hasPassword && (
                  <div className={`mb-6 p-4 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-blue-900/20 border-blue-800 text-blue-300'
                      : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}>
                    <div className="flex items-start">
                      <Shield className="w-4 h-4 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Enhanced Security</p>
                        <p className="text-xs mt-1">
                          You signed up with OAuth. Creating a password adds an extra layer of security to your account.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {hasPassword && (
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                            theme === 'dark' 
                              ? 'bg-gray-800 border-gray-700 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {hasPassword ? 'New Password' : 'Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                          theme === 'dark' 
                            ? 'bg-gray-800 border-gray-700 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder={`Enter ${hasPassword ? 'new ' : ''}password`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                          theme === 'dark' 
                            ? 'bg-gray-800 border-gray-700 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Password Requirements */}
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Password must be at least 8 characters long
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Lock className="w-4 h-4 mr-2" />
                    )}
                    {hasPassword ? 'Change Password' : 'Create Password'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}