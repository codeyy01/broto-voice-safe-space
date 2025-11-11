import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format, isAfter, subWeeks } from 'date-fns';

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  upvote_count: number;
  created_at: string;
}

const CommunityFeed = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [upvotedTickets, setUpvotedTickets] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchTickets = async () => {
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('*')
        .eq('visibility', 'public')
        .order('upvote_count', { ascending: false })
        .order('created_at', { ascending: false });

      const { data: upvotesData } = await supabase
        .from('ticket_upvotes')
        .select('ticket_id')
        .eq('user_id', user.id);

      if (ticketsData) setTickets(ticketsData as Ticket[]);
      if (upvotesData) {
        setUpvotedTickets(new Set(upvotesData.map(u => u.ticket_id)));
      }
      setLoading(false);
    };

    fetchTickets();

    // Set up realtime subscription
    const channel = supabase
      .channel('community-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: 'visibility=eq.public',
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleUpvote = async (ticketId: string) => {
    if (!user) return;

    const hasUpvoted = upvotedTickets.has(ticketId);

    try {
      if (hasUpvoted) {
        // Remove upvote
        await supabase
          .from('ticket_upvotes')
          .delete()
          .eq('ticket_id', ticketId)
          .eq('user_id', user.id);

        await supabase.rpc('decrement_upvote_count', { ticket_id: ticketId });

        setUpvotedTickets(prev => {
          const newSet = new Set(prev);
          newSet.delete(ticketId);
          return newSet;
        });
        toast.success('Upvote removed');
      } else {
        // Add upvote
        await supabase
          .from('ticket_upvotes')
          .insert({ ticket_id: ticketId, user_id: user.id });

        await supabase.rpc('increment_upvote_count', { ticket_id: ticketId });

        setUpvotedTickets(prev => new Set([...prev, ticketId]));
        toast.success('Added "Me Too"!');
      }

      // Refresh tickets to get updated count
      const { data } = await supabase
        .from('tickets')
        .select('*')
        .eq('visibility', 'public')
        .order('upvote_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (data) setTickets(data as Ticket[]);
    } catch (error: any) {
      console.error('Error updating upvote:', error);
      toast.error('Failed to update vote');
    }
  };

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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const oneWeekAgo = subWeeks(new Date(), 1);
    
    if (isAfter(date, oneWeekAgo)) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading community voices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Community Voices</h2>
        <p className="text-muted-foreground">See what others are experiencing</p>
      </div>

      {tickets.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">
            No public concerns yet
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Be the first to share a public concern and help build a better community
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const hasUpvoted = upvotedTickets.has(ticket.id);
            
            return (
              <Card
                key={ticket.id}
                className="p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <Button
                    variant={hasUpvoted ? 'default' : 'outline'}
                    size="sm"
                    className="flex flex-col items-center gap-1 min-w-[60px] h-auto py-2"
                    onClick={() => handleUpvote(ticket.id)}
                  >
                    <ThumbsUp className={`w-4 h-4 ${hasUpvoted ? 'fill-current' : ''}`} />
                    <span className="text-xs font-semibold">{ticket.upvote_count}</span>
                  </Button>

                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {getStatusIcon(ticket.status)}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-1">
                        {ticket.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
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
                        {getStatusBadge(ticket.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(ticket.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommunityFeed;
