import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  title: string;
  category: string;
  severity: 'low' | 'medium' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  visibility: 'private' | 'public';
  upvoteCount: number;
  createdAt: any;
  createdBy: string;
}

const AdminDashboard = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  useEffect(() => {
    const q = query(
      collection(db, 'tickets'),
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
  }, []);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        status: newStatus,
      });
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filterStatus !== 'all' && ticket.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && ticket.severity !== filterSeverity) return false;
    return true;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    // Sort by: Critical first, then by upvotes, then by date
    const severityOrder = { critical: 0, medium: 1, low: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    if (a.upvoteCount !== b.upvoteCount) {
      return b.upvoteCount - a.upvoteCount;
    }
    return b.createdAt?.seconds - a.createdAt?.seconds;
  });

  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    critical: tickets.filter(t => t.severity === 'critical' && t.status !== 'resolved').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Triage Dashboard</h2>
        <p className="text-muted-foreground">Manage and resolve student concerns</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-status-open" />
            <span className="text-sm text-muted-foreground">Open</span>
          </div>
          <p className="text-2xl font-semibold">{stats.open}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-status-progress" />
            <span className="text-sm text-muted-foreground">In Progress</span>
          </div>
          <p className="text-2xl font-semibold">{stats.inProgress}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-status-resolved" />
            <span className="text-sm text-muted-foreground">Resolved</span>
          </div>
          <p className="text-2xl font-semibold">{stats.resolved}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-severity-critical" />
            <span className="text-sm text-muted-foreground">Critical</span>
          </div>
          <p className="text-2xl font-semibold">{stats.critical}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets */}
      {sortedTickets.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">No tickets match your filters</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedTickets.map((ticket) => (
            <Card key={ticket.id} className="p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{ticket.title}</h3>
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
                      {ticket.visibility === 'public' && (
                        <Badge variant="outline" className="text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {ticket.upvoteCount} upvotes
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-[200px]">
                  <Select
                    value={ticket.status}
                    onValueChange={(value) => handleStatusChange(ticket.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
