/**
 * Icon wrapper — re-exports Ionicons (font-based, Expo Go compatible)
 * with the same `size` + `color` props as lucide-react-native.
 * Swap `lucide-react-native` imports with `../lib/icons` across the app.
 */
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
type IconProps = { size?: number; color?: string };

function icon(name: IoniconsName) {
  return function Icon({ size = 24, color = '#000' }: IconProps) {
    return <Ionicons name={name} size={size} color={color} />;
  };
}

// Navigation / UI
export const Menu        = icon('menu-outline');
export const Trash2      = icon('trash-outline');
export const Search      = icon('search-outline');
export const X           = icon('close-outline');
export const Check       = icon('checkmark-outline');
export const ChevronDown = icon('chevron-down-outline');
export const ChevronUp   = icon('chevron-up-outline');
export const ExternalLink= icon('open-outline');
export const Link2       = icon('link-outline');

// Chat / Files
export const Send        = icon('send-outline');
export const Paperclip   = icon('attach-outline');
export const FileText    = icon('document-text-outline');
export const Image       = icon('image-outline');
export const Copy        = icon('copy-outline');
export const Zap         = icon('flash-outline');

// Git
export const GitBranch   = icon('git-branch-outline');
export const GitCommit   = icon('git-commit-outline');
export const FolderGit2  = icon('folder-open-outline');

// Repo meta
export const Star        = icon('star-outline');
export const Lock        = icon('lock-closed-outline');
export const Wifi        = icon('wifi-outline');
export const WifiOff     = icon('cloud-offline-outline');
export const MessageSquare = icon('chatbubble-outline');

// Severity
export const ShieldAlert   = icon('shield-checkmark-outline');
export const AlertCircle   = icon('alert-circle-outline');
export const AlertTriangle = icon('warning-outline');
export const CheckCircle2  = icon('checkmark-circle-outline');
export const Info          = icon('information-circle-outline');

// Diff
export const Plus          = icon('add-outline');
export const Minus         = icon('remove-outline');
