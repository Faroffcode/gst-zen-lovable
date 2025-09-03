import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordProtectionProps {
  onPasswordCorrect: () => void;
}

const PasswordProtection = ({ onPasswordCorrect }: PasswordProtectionProps) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Set your desired password here
  const CORRECT_PASSWORD = '9474615046';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (password === CORRECT_PASSWORD) {
      // Store authentication status in localStorage
      localStorage.setItem('websiteAccess', 'granted');
      onPasswordCorrect();
      toast({
        title: "Access Granted",
        description: "Welcome to BIO TECH CENTRE!",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password. Please try again.",
        variant: "destructive",
      });
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
            <Lock className="h-8 w-8 text-purple-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            BIO TECH CENTRE
          </CardTitle>
          <CardDescription className="text-gray-600">
            This website is password protected. Please enter the password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700" 
              disabled={loading}
            >
              {loading ? "Verifying..." : "Enter Website"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Authorized access only. Please contact the administrator if you need access.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordProtection;