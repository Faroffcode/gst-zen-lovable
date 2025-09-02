import { useState, useEffect } from 'react';

export const usePasswordAccess = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has already entered the correct password
    const accessGranted = localStorage.getItem('websiteAccess');
    setHasAccess(accessGranted === 'granted');
    setLoading(false);
  }, []);

  const grantAccess = () => {
    setHasAccess(true);
  };

  const revokeAccess = () => {
    localStorage.removeItem('websiteAccess');
    setHasAccess(false);
  };

  return { hasAccess, loading, grantAccess, revokeAccess };
};