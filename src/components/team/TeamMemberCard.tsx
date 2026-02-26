// src/components/team/TeamMemberCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Link as LinkIcon } from 'lucide-react';

const F = '"Nunito", "Varela Round", sans-serif';

// Warm Japandi palette
const ACCENTS = [
  // sage
  { ringBg: '#d4e8d6', ringBorder: '#aed0b2', pillBg: '#eaf2eb', pillBorder: '#aed0b2', pillText: '#3d6b42', hoverBorder: '#7a9e7e', dot: '#7a9e7e' },
  // mauve
  { ringBg: '#e8d8f0', ringBorder: '#c8a8d8', pillBg: '#f4eef9', pillBorder: '#c8a8d8', pillText: '#5c3a72', hoverBorder: '#a07ab8', dot: '#a07ab8' },
  // ochre
  { ringBg: '#f5e8cc', ringBorder: '#e0c888', pillBg: '#faf3e5', pillBorder: '#e0c888', pillText: '#7a5218', hoverBorder: '#c9a96e', dot: '#c9a96e' },
  // teal
  { ringBg: '#d4ede8', ringBorder: '#8ed4bc', pillBg: '#eaf7f4', pillBorder: '#8ed4bc', pillText: '#2d6b62', hoverBorder: '#7ab8b0', dot: '#7ab8b0' },
  // rose
  { ringBg: '#f5dbd8', ringBorder: '#ddb4ae', pillBg: '#faeeed', pillBorder: '#ddb4ae', pillText: '#8f3d35', hoverBorder: '#c9867c', dot: '#c9867c' },
  // slate
  { ringBg: '#d4dde8', ringBorder: '#b0c0d0', pillBg: '#edf1f5', pillBorder: '#b0c0d0', pillText: '#3d5068', hoverBorder: '#6b7b8d', dot: '#6b7b8d' },
];

interface TeamMemberCardProps {
  imageUrl: string;
  name: string;
  role: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  index?: number;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  imageUrl, name, role, githubUrl, linkedinUrl, websiteUrl, index = 0,
}) => {
  const acc = ACCENTS[index % ACCENTS.length];
  const hasSocials = githubUrl || linkedinUrl || websiteUrl;

  return (
    <motion.div
      style={{
        background: '#fdf9f4',
        border: `1.5px solid #e0d8cc`,
        borderRadius: 20,
        padding: '28px 24px 24px',
        textAlign: 'center',
        fontFamily: F,
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
      whileHover={{
        y: -6,
        borderColor: acc.hoverBorder,
        boxShadow: `0 12px 32px ${acc.ringBg}cc`,
        transition: { duration: 0.2 },
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Subtle accent blob in corner */}
      <div style={{
        position: 'absolute', top: -24, right: -24,
        width: 80, height: 80, borderRadius: '50%',
        background: acc.ringBg, opacity: 0.6,
        pointerEvents: 'none',
      }} />

      {/* Avatar with accent ring */}
      <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 16px' }}>
        {/* Outer accent ring */}
        <div style={{
          position: 'absolute', inset: -4,
          borderRadius: '50%',
          background: acc.ringBg,
          border: `2px solid ${acc.ringBorder}`,
        }} />
        {/* Inner white gap */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          background: '#fdf9f4',
          border: `2px solid ${acc.ringBg}`,
        }} />
        <img
          src={imageUrl}
          alt={`Photo of ${name}`}
          style={{
            position: 'relative',
            width: '100%', height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
        {/* Status dot */}
        <div style={{
          position: 'absolute', bottom: 4, right: 4,
          width: 12, height: 12, borderRadius: '50%',
          background: acc.dot,
          border: '2px solid #fdf9f4',
        }} />
      </div>

      {/* Name */}
      <h3 style={{
        fontFamily: F,
        fontWeight: 800,
        fontSize: 17,
        color: '#2c2416',
        margin: '0 0 6px',
        lineHeight: 1.3,
      }}>
        {name}
      </h3>

      {/* Role pill */}
      <span style={{
        display: 'inline-block',
        fontFamily: F,
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.04em',
        color: acc.pillText,
        background: acc.pillBg,
        border: `1px solid ${acc.pillBorder}`,
        borderRadius: 999,
        padding: '3px 12px',
        marginBottom: hasSocials ? 16 : 4,
      }}>
        {role}
      </span>

      {/* Social links */}
      {hasSocials && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {githubUrl && <SocialBtn href={githubUrl} acc={acc} label="GitHub"><Github size={15} /></SocialBtn>}
          {websiteUrl && <SocialBtn href={websiteUrl} acc={acc} label="Website"><LinkIcon size={15} /></SocialBtn>}
          {linkedinUrl && <SocialBtn href={linkedinUrl} acc={acc} label="LinkedIn"><Linkedin size={15} /></SocialBtn>}
        </div>
      )}
    </motion.div>
  );
};

const SocialBtn: React.FC<{
  href: string; acc: typeof ACCENTS[0]; label: string; children: React.ReactNode;
}> = ({ href, acc, label, children }) => (
  <motion.a
    href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
    style={{
      width: 32, height: 32, borderRadius: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f5f0e8',
      border: `1px solid #e0d8cc`,
      color: '#7a6e62',
      textDecoration: 'none',
    }}
    whileHover={{
      background: acc.pillBg,
      borderColor: acc.pillBorder,
      color: acc.pillText,
      scale: 1.1,
    }}
    whileTap={{ scale: 0.95 }}
  >
    {children}
  </motion.a>
);

export default TeamMemberCard;