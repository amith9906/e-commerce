'use strict';
import { Mail, Phone, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBrand } from '../context/BrandContext';

const FacebookIcon = ({ size = 18, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    {...props}
  >
    <path d="M13.5 6.5h2.5V3h-2.9c-3.2 0-4.1 1.5-4.1 4.3V9H6v3h2.1v9h3.5v-9h2.5l.4-3h-2.9V7c0-.5.4-.5.9-.5z" />
  </svg>
);

const InstagramIcon = ({ size = 18, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <path d="M16 11.37a4 4 0 1 1-4.63-4.63 4 4 0 0 1 4.63 4.63z" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const YoutubeIcon = ({ size = 18, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M21.8 8s-.2-1.4-.9-2c-.8-.8-1.7-.8-2.1-.9C16.9 5 12 5 12 5s-4.9 0-6.8.1c-.4 0-1.3.1-2.1.9-.7.6-.9 2-.9 2S2 9.8 2 11.7v.6c0 1.9.1 3.7.1 3.7s.2 1.4.9 2c.8.8 1.8.8 2.2.9 1.6.1 6.8.1 6.8.1s4.9 0 6.8-.1c.4 0 1.3-.1 2.1-.9.7-.6.9-2 .9-2s.1-1.8.1-3.7v-.6c0-1.9-.1-3.7-.1-3.7z" />
    <polygon points="10 14.5 16 12 10 9.5 10 14.5" fill="currentColor" stroke="none" />
  </svg>
);

const socialIcons = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
};

export default function Footer() {
  const { storeName, settings = {}, socialLinks = {} } = useBrand();
  const support = settings.supportContacts || {};
  const links = [
    { key: 'facebook', url: socialLinks.facebookUrl, show: socialLinks.showFacebook },
    { key: 'instagram', url: socialLinks.instagramUrl, show: socialLinks.showInstagram },
    { key: 'youtube', url: socialLinks.youtubeUrl, show: socialLinks.showYoutube }
  ].filter((link) => link.url && link.show);

  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <span className="footer-brand-name">{storeName || 'Our Store'}</span>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Built with care for every customer.
        </p>
      </div>
      <div className="footer-contact">
        <div>
          <Mail size={16} />
          <span>{support.email || `support@${storeName?.toLowerCase()?.replace(/\s+/g, '') || 'store'}.com`}</span>
        </div>
        <div>
          <Phone size={16} />
          <span>{support.phone || '+1 (555) 000-0000'}</span>
        </div>
        <div>
          <Globe size={16} />
          <Link to="/contact">Contact us</Link>
        </div>
      </div>
      {links.length > 0 && (
        <div className="footer-social">
          <strong>Follow us</strong>
          <div className="footer-social-icons">
            {links.map((link) => {
              const Icon = socialIcons[link.key];
              return (
                <a key={link.key} href={link.url} target="_blank" rel="noreferrer" className="footer-social-link">
                  <Icon size={18} />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </footer>
  );
}
