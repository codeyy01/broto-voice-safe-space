import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Lock, Globe } from 'lucide-react';

const NewComplaint = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    severity: '',
    description: '',
    visibility: 'private' as 'private' | 'public',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.title.length < 10) {
      toast.error('Title must be at least 10 characters');
      return;
    }

    if (formData.description.length < 20) {
      toast.error('Description must be at least 20 characters');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'tickets'), {
        ...formData,
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'open',
        upvoteCount: 0,
        upvotedBy: {},
      });

      toast.success('Complaint submitted successfully!');
      setFormData({
        title: '',
        category: '',
        severity: '',
        description: '',
        visibility: 'private',
      });
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">New Complaint</h2>
        <p className="text-muted-foreground">Share your concern with us</p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Brief description of your concern"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={100}
              required
            />
            <p className="text-xs text-muted-foreground">
              {formData.title.length}/100 characters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="staff">Staff Related</SelectItem>
                  <SelectItem value="facilities">Facilities</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about your concern..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              maxLength={1000}
              required
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/1000 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.visibility === 'private' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setFormData({ ...formData, visibility: 'private' })}
              >
                <Lock className="w-4 h-4 mr-2" />
                Private
              </Button>
              <Button
                type="button"
                variant={formData.visibility === 'public' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setFormData({ ...formData, visibility: 'public' })}
              >
                <Globe className="w-4 h-4 mr-2" />
                Public
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {formData.visibility === 'private'
                ? '🔒 Only visible to admins'
                : '🌍 Visible to all students in the community feed'}
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default NewComplaint;
