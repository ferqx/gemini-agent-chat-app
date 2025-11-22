import { useState, useEffect } from 'react';
import { UserProfile } from '../types';

const USER_PROFILE_KEY = 'agno_user_profile';

/**
 * Custom hook to manage user profile data (name, avatar).
 * Persists data to localStorage.
 * 
 * @returns {Object} An object containing the user profile and a save function.
 */
export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: '' });

  useEffect(() => {
    const savedProfile = localStorage.getItem(USER_PROFILE_KEY);
    if (savedProfile) {
      try {
        setUserProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Failed to parse user profile");
      }
    }
  }, []);

  /**
   * Saves the user profile to state and localStorage.
   * @param {UserProfile} profile - The new user profile object.
   */
  const handleSaveUserProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  };

  return {
    userProfile,
    saveUserProfile: handleSaveUserProfile
  };
};