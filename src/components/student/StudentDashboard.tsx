import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  category: string;
  severity: 'low' | 'medium' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: any;
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'tickets'),
      where('createdBy', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ticket[];
      setTickets(ticketsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-5 h-5 text-status-open" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-status-progress" />;
      case 'resolved':
        return <CheckCircle2 className="w-5 h-5 text-status-resolved" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      open: 'bg-status-open/10 text-status-open border-status-open/20',
      in_progress: 'bg-status-progress/10 text-status-progress border-status-progress/20',
      resolved: 'bg-status-resolved/10 text-status-resolved border-status-resolved/20',
    };

    const labels: Record<string, string> = {
      open: 'Open',
      in_progress: 'In Progress',
      resolved: 'Resolved',
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading your tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Your Dashboard</h2>
        <p className="text-muted-foreground">Track your submitted concerns</p>
      </div>

      {tickets.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">
            No complaints yet! Hope your day's going smoothly 😊
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            When you submit a concern, it will appear here
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(ticket.status)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1">
                      {ticket.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {ticket.category}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          ticket.severity === 'critical'
                            ? 'border-severity-critical text-severity-critical'
                            : ticket.severity === 'medium'
                            ? 'border-severity-medium text-severity-medium'
                            : 'border-severity-low text-severity-low'
                        }`}
                      >
                        {ticket.severity}
                      </Badge>
                    </div>
                  </div>
                </div>
                {getStatusBadge(ticket.status)}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
