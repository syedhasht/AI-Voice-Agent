import { useNavigate } from 'react-router-dom';
import { PlusCircle, ClipboardList } from 'lucide-react';
import { Card, Button } from '../common';

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card className="h-full">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Quick Actions</h3>
      <div className="space-y-3">
        <Button
          variant="primary"
          className="w-full justify-start"
          icon={PlusCircle}
          onClick={() => navigate('/create-order')}
        >
          New Order
        </Button>
        <Button
          variant="secondary"
          className="w-full justify-start"
          icon={ClipboardList}
          onClick={() => navigate('/orders')}
        >
          View All Orders
        </Button>
      </div>
    </Card>
  );
}
