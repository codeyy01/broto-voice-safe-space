import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  title: string;
  category: string;
  severity: 'low' | 'medium' | 'critical';
  upvoteCount: number;
  upvotedBy: Record<string, boolean>;
  createdAt: any;
}

const CommunityFeed = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'tickets'),
      where('visibility', '==', 'public'),
      orderBy('upvoteCount', 'desc'),
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

  const handleUpvote = async (ticketId: string, currentUpvotes: Record<string, boolean>) => {
    if (!user) return;

    const hasUpvoted = currentUpvotes[user.uid];
    const ticketRef = doc(db, 'tickets', ticketId);

    try {
      if (hasUpvoted) {
        // Remove upvote
        await updateDoc(ticketRef, {
          upvoteCount: increment(-1),
          [`upvotedBy.${user.uid}`]: false,
        });
        toast.success('Upvote removed');
      } else {
        // Add upvote
        await updateDoc(ticketRef, {
          upvoteCount: increment(1),
          [`upvotedBy.${user.uid}`]: true,
        });
        toast.success('Added "Me Too"!');
      }
    } catch (error) {
      console.error('Error updating upvote:', error);
      toast.error('Failed to update vote');
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
            const hasUpvoted = user ? ticket.upvotedBy[user.uid] : false;
            
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
                    onClick={() => handleUpvote(ticket.id, ticket.upvotedBy)}
                  >
                    <ThumbsUp className={`w-4 h-4 ${hasUpvoted ? 'fill-current' : ''}`} />
                    <span className="text-xs font-semibold">{ticket.upvoteCount}</span>
                  </Button>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-2">
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
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommunityFeed;
