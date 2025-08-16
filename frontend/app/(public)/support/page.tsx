'use client';

import { useTheme } from '@/lib/theme-context';
import { useState } from 'react';
import { toast } from 'sonner';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  MessageCircle, 
  HeadphonesIcon,
  Users,
  Star
} from 'lucide-react';

const supportCategories = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'billing', label: 'Billing & Payment' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'other', label: 'Other' }
];

interface FormData {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
}

export default function SupportPage() {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.category || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || 'Your message has been sent successfully! We\'ll get back to you within 24 hours.');
        setFormData({
          name: '',
          email: '',
          subject: '',
          category: '',
          message: ''
        });
      } else {
        toast.error(data.message || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to send message. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen relative ${
      theme === 'dark' ? 'bg-black' : 'bg-white'
    }`}>
      {/* Clean Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Subtle ambient orbs */}
        <div className="absolute top-20 left-10 w-80 h-80 bg-neon-blue/3 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-blue/2 rounded-full blur-3xl" />
      </div>

      {/* Clean Hero Section */}
      <section className="relative pt-20 pb-12">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Simple Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8 ${
              theme === 'dark'
                ? 'bg-white/5 border-white/10 backdrop-blur-xl'
                : 'bg-black/5 border-black/10 backdrop-blur-xl'
            }`}>
              <HeadphonesIcon className="w-4 h-4 text-neon-blue" />
              <span className="text-sm font-medium">24/7 Support Available</span>
            </div>

            {/* Clean Title */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-neon-blue">
                Get Support
              </span>
              <br />
              <span className={theme === 'dark' ? 'text-white' : 'text-black'}>
                When You Need It
              </span>
            </h1>

            <p className={`text-xl md:text-2xl mb-12 leading-relaxed ${
              theme === 'dark' ? 'text-white/80' : 'text-black/80'
            }`}>
              Professional technical assistance from our expert team.
              <br />
              <span className="text-neon-blue font-semibold">We're here to help you succeed.</span>
            </p>

            {/* Clean Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {[
                { value: '<1H', label: 'Response Time' },
                { value: '99%', label: 'Success Rate' },
                { value: '24/7', label: 'Available' },
                { value: '500+', label: 'Issues Solved' }
              ].map((stat, index) => (
                <div key={index} className={`p-4 rounded-xl ${
                  theme === 'dark'
                    ? 'bg-white/5 border border-white/10'
                    : 'bg-white/50 border border-black/10'
                }`}>
                  <div className="text-2xl font-bold text-neon-blue mb-1">{stat.value}</div>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-white/70' : 'text-black/70'
                  }`}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto space-y-12">
            
            {/* Contact Form */}
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4 text-neon-blue">
                  Send us a Message
                </h2>
                <p className="text-muted-foreground">
                  Have a specific question or need help with something? Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className={`p-8 rounded-xl border ${
                theme === 'dark'
                  ? 'bg-white/5 border-white/10 backdrop-blur-xl'
                  : 'bg-white/50 border-black/10 backdrop-blur-xl'
              }`}>
                <div className="space-y-6">
                  {/* Name & Email Row */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-neon-blue ${
                          theme === 'dark'
                            ? 'bg-white/5 border-white/10 text-white placeholder-white/50'
                            : 'bg-white/50 border-black/10 text-black placeholder-black/50'
                        }`}

                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-neon-blue ${
                          theme === 'dark'
                            ? 'bg-white/5 border-white/10 text-white placeholder-white/50'
                            : 'bg-white/50 border-black/10 text-black placeholder-black/50'
                        }`}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-neon-blue ${
                        theme === 'dark'
                          ? 'bg-white/5 border-white/10 text-white placeholder-white/50'
                          : 'bg-white/50 border-black/10 text-black placeholder-black/50'
                      }`}
                      placeholder="What's this about?"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium mb-2">
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-neon-blue ${
                        theme === 'dark'
                          ? 'bg-white/5 border-white/10 text-white [&>option]:bg-black [&>option]:text-white'
                          : 'bg-white/50 border-black/10 text-black [&>option]:bg-white [&>option]:text-black'
                      }`}
                      required
                    >
                      <option value="" className={theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}>
                        Select a category
                      </option>
                      {supportCategories.map((cat) => (
                        <option 
                          key={cat.value} 
                          value={cat.value}
                          className={theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}
                        >
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={6}
                      className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-neon-blue resize-none ${
                        theme === 'dark'
                          ? 'bg-white/5 border-white/10 text-white placeholder-white/50'
                          : 'bg-white/50 border-black/10 text-black placeholder-black/50'
                      }`}
                      placeholder="Tell us more about your question or issue..."
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-4 rounded-lg font-medium transition-all duration-200 text-white hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-neon-blue hover:bg-neon-blue/90"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>

                  {/* Privacy Notice */}
                  <p className="text-xs text-muted-foreground text-center">
                    By submitting this form, you agree to our privacy policy and terms of service. 
                    We'll only use your information to respond to your inquiry.
                  </p>
                </div>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* Contact Information - Full Width */}
      <section className="relative pb-20">
        <div className="container mx-auto px-4">
          <div className={`p-8 rounded-xl border w-full ${
            theme === 'dark'
              ? 'bg-white/5 border-white/10 backdrop-blur-xl'
              : 'bg-white/50 border-black/10 backdrop-blur-xl'
          } shadow-lg`}>
              <h2 className="text-2xl font-bold mb-6 text-neon-blue text-center">
                Contact Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-neon-blue/10 flex-shrink-0">
                    <Phone className="w-5 h-5 text-neon-blue" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Phone Support</h3>
                    <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-white/60' : 'text-black/60'}`}>
                      Direct line for urgent assistance
                    </p>
                    <a 
                      href="tel:+6289643143750" 
                      className="text-neon-blue hover:text-neon-blue/80 font-medium transition-colors text-sm"
                    >
                      +62 896-4314-3750
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-neon-blue/10 flex-shrink-0">
                    <Mail className="w-5 h-5 text-neon-blue" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Email Support</h3>
                    <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-white/60' : 'text-black/60'}`}>
                      Specialized departments
                    </p>
                    <div className="space-y-1">
                      <a 
                        href="mailto:support@a1dev.id" 
                        className="block text-neon-blue hover:text-neon-blue/80 text-xs font-medium transition-colors"
                      >
                        support@a1dev.id
                      </a>
                      <a 
                        href="mailto:security@a1dev.id" 
                        className="block text-neon-blue hover:text-neon-blue/80 text-xs font-medium transition-colors"
                      >
                        security@a1dev.id
                      </a>
                      <a 
                        href="mailto:admin@a1dev.id" 
                        className="block text-neon-blue hover:text-neon-blue/80 text-xs font-medium transition-colors"
                      >
                        admin@a1dev.id
                      </a>
                    </div>
                  </div>
                </div>

                {/* Office Location */}
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-neon-blue/10 flex-shrink-0">
                    <MapPin className="w-5 h-5 text-neon-blue" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Office Location</h3>
                    <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-white/60' : 'text-black/60'}`}>
                      Visit our office in South Sulawesi
                    </p>
                    <div className={`text-xs ${theme === 'dark' ? 'text-white/90' : 'text-black/90'}`}>
                      Jl. Pelita Raya<br />
                      Kota Makassar, South Sulawesi<br />
                      Indonesia 90222
                    </div>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-neon-blue/10 flex-shrink-0">
                    <Clock className="w-5 h-5 text-neon-blue" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Business Hours</h3>
                    <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-white/60' : 'text-black/60'}`}>
                      We're available during these hours
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Mon-Fri</span>
                        <span className="text-neon-blue font-medium">08:00-17:00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saturday</span>
                        <span className="text-neon-blue font-medium">09:00-15:00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sunday</span>
                        <span className="text-red-400 font-medium">Closed</span>
                      </div>
                      <div className="pt-1 mt-2 border-t border-neon-blue/20">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-neon-blue font-medium text-xs">Emergency: 24/7</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map - Full Width at Bottom */}
              <div className="mt-8">
                <h3 className="font-semibold mb-4 text-center">Find Us</h3>
                <div className="rounded-lg overflow-hidden border border-neon-blue/20">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3973.582842096709!2d119.42435207496785!3d-5.1706937948699!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dbf1d3b3c2f1b41%3A0x3030bfbcaf770b0!2sJl.%20Pelita%20Raya%2C%20Kota%20Makassar%2C%20Sulawesi%20Selatan!5e0!3m2!1sen!2sid!4v1642678901234!5m2!1sen!2sid"
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              </div>
            </div>
        </div>
      </section>
    </div>
  );
}
