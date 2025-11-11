import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, FileText, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user, userData, signOut } = useAuth();
  const navigate = useNavigate();
  const [ticketCount, setTicketCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchTicketCount = async () => {
      const { count, error } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      if (!error && count !== null) {
        setTicketCount(count);
      }
      setLoading(false);
    };

    fetchTicketCount();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Your Profile</h2>
        <p className="text-muted-foreground">View your account information</p>
      </div>

      <Card className="p-8">
        <div className="space-y-6">
          {/* Display Name */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Display Name</p>
              <p className="text-lg font-medium text-foreground">
                {userData?.displayName || 'Not set'}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Email Address</p>
              <p className="text-lg font-medium text-foreground">
                {userData?.email || user?.email}
              </p>
            </div>
          </div>

          {/* Ticket Count */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Tickets Submitted</p>
              <p className="text-lg font-medium text-foreground">
                {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Logout Button */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground mb-1">Sign Out</h3>
            <p className="text-sm text-muted-foreground">
              You can sign back in anytime with your credentials
            </p>
          </div>
          <Button variant="destructive" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
