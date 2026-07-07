import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, Pill, Package, CheckCircle } from 'lucide-react';
import { Button, Card, Input } from '../components/common';
import { PageTransition } from '../components/layout';
import { createOrder } from '../services';
import { useToast } from '../context';

export default function CreateOrder() {
  const navigate = useNavigate();
  const toast = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer: '',
    phone: '',
    medicine: '',
    quantity: '',
  });
  const [phoneDigits, setPhoneDigits] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.customer.trim()) errs.customer = 'Customer name is required';
    if (!form.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (phoneDigits.length !== 10) {
      errs.phone = 'Phone number must be exactly 10 digits';
    }
    if (!form.medicine.trim()) errs.medicine = 'Medicine name is required';
    if (!form.quantity || Number(form.quantity) < 1) errs.quantity = 'Quantity must be at least 1';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await createOrder(form);
      toast.success('Order created successfully');
      setSubmitted(true);
      setTimeout(() => navigate('/orders'), 1200);
    } catch (err) {
      toast.error(err.message);
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handlePhoneChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setPhoneDigits(digits);
    setForm((prev) => ({ ...prev, phone: digits ? `+92${digits}` : '' }));
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
  };

  if (submitted) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-emerald/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-emerald" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Order Created!</h2>
            <p className="text-text-secondary">The AI agent will call the customer shortly.</p>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Create Order</h1>
          <p className="text-sm text-text-secondary mt-1">Enter the medication order details</p>
        </div>

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Customer Name"
                placeholder="e.g. John Doe"
                icon={User}
                value={form.customer}
                onChange={(e) => updateField('customer', e.target.value)}
                error={errors.customer}
              />
              <Input
                label="Phone Number"
                placeholder="3014605967"
                icon={Phone}
                prefix="+92"
                value={phoneDigits}
                onChange={(e) => handlePhoneChange(e.target.value)}
                error={errors.phone}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Medicine Name"
                placeholder="e.g. Amoxicillin 500mg"
                icon={Pill}
                value={form.medicine}
                onChange={(e) => updateField('medicine', e.target.value)}
                error={errors.medicine}
              />
              <Input
                label="Quantity"
                type="number"
                placeholder="e.g. 30"
                icon={Package}
                value={form.quantity}
                onChange={(e) => updateField('quantity', e.target.value)}
                error={errors.quantity}
                min="1"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" size="lg" className="w-full" loading={saving}>
                Create Order
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageTransition>
  );
}
