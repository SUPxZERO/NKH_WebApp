/**
 * Clipboard Utility
 *
 * Safe clipboard operations with data sanitization and format conversion.
 * Prevents copying of sensitive data and provides user feedback.
 */

import { ClipboardCopyOptions, ClipboardDataType } from '@/app/types/shortcuts';
import { sanitizeForClipboard, convertToCSV, isClipboardAvailable } from './shortcuts';
import { toastSuccess, toastError } from './toast';

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (
  data: any,
  options: ClipboardCopyOptions = {}
): Promise<boolean> => {
  const {
    type = 'text',
    successMessage = 'Copied to clipboard',
    errorMessage = 'Failed to copy to clipboard',
    showToast = true,
  } = options;

  // Check clipboard API availability
  if (!isClipboardAvailable()) {
    if (showToast) {
      toastError('Clipboard API not available in your browser');
    }
    return false;
  }

  try {
    // Sanitize data (remove sensitive fields)
    const sanitized = sanitizeForClipboard(data);

    let textToCopy: string;

    // Format data based on type
    switch (type) {
      case 'json':
        textToCopy = JSON.stringify(sanitized, null, 2);
        break;

      case 'csv':
        if (Array.isArray(sanitized)) {
          textToCopy = convertToCSV(sanitized);
        } else {
          textToCopy = convertToCSV([sanitized]);
        }
        break;

      case 'html':
        // For HTML, we assume the data is already HTML string
        textToCopy = typeof sanitized === 'string' ? sanitized : JSON.stringify(sanitized);
        break;

      case 'text':
      default:
        if (typeof sanitized === 'string') {
          textToCopy = sanitized;
        } else if (typeof sanitized === 'object') {
          textToCopy = JSON.stringify(sanitized, null, 2);
        } else {
          textToCopy = String(sanitized);
        }
        break;
    }

    // Copy to clipboard
    await navigator.clipboard.writeText(textToCopy);

    // Show success feedback
    if (showToast) {
      toastSuccess(successMessage);
    }

    return true;
  } catch (error) {
    console.error('Clipboard copy failed:', error);

    // Show error feedback
    if (showToast) {
      toastError(errorMessage);
    }

    return false;
  }
};

/**
 * Copy table data to clipboard
 * Handles both single row and multiple rows
 */
export const copyTableData = async (
  rows: any | any[],
  format: 'json' | 'csv' = 'csv'
): Promise<boolean> => {
  const dataArray = Array.isArray(rows) ? rows : [rows];

  return copyToClipboard(dataArray, {
    type: format,
    successMessage: `Copied ${dataArray.length} row${dataArray.length === 1 ? '' : 's'} as ${format.toUpperCase()}`,
  });
};

/**
 * Copy formatted text with rich content
 */
export const copyRichText = async (html: string, plainText: string): Promise<boolean> => {
  if (!isClipboardAvailable()) {
    toastError('Clipboard API not available in your browser');
    return false;
  }

  try {
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([plainText], { type: 'text/plain' }),
    });

    await navigator.clipboard.write([clipboardItem]);
    toastSuccess('Copied to clipboard');
    return true;
  } catch (error) {
    console.error('Rich text copy failed:', error);
    // Fallback to plain text
    return copyToClipboard(plainText, { type: 'text' });
  }
};

/**
 * Copy URL to clipboard
 */
export const copyUrl = async (url: string, label?: string): Promise<boolean> => {
  return copyToClipboard(url, {
    type: 'text',
    successMessage: label ? `${label} copied` : 'URL copied to clipboard',
  });
};

/**
 * Copy current page URL
 */
export const copyCurrentUrl = async (): Promise<boolean> => {
  return copyUrl(window.location.href, 'Page URL');
};

/**
 * Read from clipboard
 */
export const readFromClipboard = async (): Promise<string | null> => {
  if (!isClipboardAvailable()) {
    toastError('Clipboard API not available in your browser');
    return null;
  }

  try {
    const text = await navigator.clipboard.readText();
    return text;
  } catch (error) {
    console.error('Clipboard read failed:', error);
    toastError('Failed to read from clipboard');
    return null;
  }
};

/**
 * Copy with fallback for older browsers
 */
export const copyWithFallback = (text: string): boolean => {
  // Modern API
  if (isClipboardAvailable()) {
    navigator.clipboard.writeText(text).then(
      () => toastSuccess('Copied to clipboard'),
      () => execCommandCopy(text)
    );
    return true;
  }

  // Fallback for older browsers
  return execCommandCopy(text);
};

/**
 * Fallback copy using execCommand (deprecated but widely supported)
 */
const execCommandCopy = (text: string): boolean => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);

  try {
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (successful) {
      toastSuccess('Copied to clipboard');
      return true;
    } else {
      toastError('Failed to copy to clipboard');
      return false;
    }
  } catch (error) {
    console.error('execCommand copy failed:', error);
    document.body.removeChild(textarea);
    toastError('Failed to copy to clipboard');
    return false;
  }
};
