import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        {...props}
        ref={ref}
        className={`border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm ${className}`}
      />
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;