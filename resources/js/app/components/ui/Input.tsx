import React from 'react';
import { cn } from '@/app/utils/cn';
import { AlertCircle, Check, Eye, EyeOff, Search, X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outline' | 'ghost';
  inputSize?: 'sm' | 'md' | 'lg';
  clearable?: boolean;
  onClear?: () => void;
}

const variants = {
  default: 'bg-card border-border hover:border-primary/30 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
  filled: 'bg-secondary border-transparent hover:bg-secondary-hover focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
  outline: 'bg-transparent border-border hover:border-primary/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
  ghost: 'bg-transparent border-transparent hover:bg-secondary/50 focus-within:bg-secondary',
};

const sizes = {
  sm: 'py-2 text-sm',
  md: 'py-3 text-sm',
  lg: 'py-4 text-base',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, success, leftIcon, rightIcon, variant = 'default', inputSize = 'md', clearable, onClear, id, value, ...props }, ref) => {
    const inputId = id || props.name || `input-${Math.random().toString(36).slice(2)}`;
    const hasValue = value !== undefined && value !== '';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-2 text-sm font-semibold text-foreground"
          >
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <div
          className={cn(
            'relative flex items-center rounded-xl border transition-all duration-200',
            variants[variant],
            error && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20 hover:border-destructive',
            success && 'border-success focus-within:border-success focus-within:ring-success/20 hover:border-success',
          )}
        >
          {leftIcon && (
            <span className="pl-4 text-muted-foreground flex-shrink-0">{leftIcon}</span>
          )}
          <input
            id={inputId}
            ref={ref}
            value={value}
            className={cn(
              'w-full bg-transparent outline-none',
              'placeholder:text-muted-foreground/60',
              'text-foreground px-4',
              sizes[inputSize],
              leftIcon && 'pl-2',
              (rightIcon || clearable || error || success) && 'pr-2',
              'rounded-xl',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            {...props}
          />
          {clearable && hasValue && (
            <button
              type="button"
              onClick={onClear}
              className="pr-3 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {error && !rightIcon && (
            <span className="pr-4 text-destructive flex-shrink-0">
              <AlertCircle className="h-5 w-5" />
            </span>
          )}
          {success && !rightIcon && !error && (
            <span className="pr-4 text-success flex-shrink-0">
              <Check className="h-5 w-5" />
            </span>
          )}
          {rightIcon && (
            <span className="pr-4 text-muted-foreground flex-shrink-0">{rightIcon}</span>
          )}
        </div>
        {hint && !error && !success && (
          <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
        )}
        {error && (
          <p className="mt-2 text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
        {success && !error && (
          <p className="mt-2 text-xs text-success flex items-center gap-1">
            <Check className="h-3 w-3" />
            {success}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Password Input with toggle visibility
export interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {
  showStrength?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showStrength, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

// Search Input with built-in icon
export interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (props, ref) => {
    return (
      <Input
        ref={ref}
        leftIcon={<Search className="h-5 w-5" />}
        placeholder={props.placeholder || 'Search...'}
        clearable
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

// Textarea component with same styling
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  variant?: 'default' | 'filled' | 'outline';
  showCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, success, variant = 'default', showCount, maxLength, id, value, ...props }, ref) => {
    const inputId = id || props.name || `textarea-${Math.random().toString(36).slice(2)}`;
    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-2 text-sm font-semibold text-foreground"
          >
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <div
          className={cn(
            'relative rounded-xl border transition-all duration-200',
            variants[variant],
            error && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20 hover:border-destructive',
            success && 'border-success focus-within:border-success focus-within:ring-success/20 hover:border-success',
          )}
        >
          <textarea
            id={inputId}
            ref={ref}
            value={value}
            maxLength={maxLength}
            className={cn(
              'w-full bg-transparent outline-none resize-none',
              'placeholder:text-muted-foreground/60',
              'text-foreground px-4 py-3',
              'rounded-xl min-h-[120px]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            {...props}
          />
          {showCount && maxLength && (
            <div className="absolute bottom-2 right-3 text-xs text-muted-foreground">
              <span className={cn(charCount > maxLength * 0.9 && 'text-warning', charCount >= maxLength && 'text-destructive')}>
                {charCount}
              </span>
              /{maxLength}
            </div>
          )}
        </div>
        {hint && !error && !success && (
          <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
        )}
        {error && (
          <p className="mt-2 text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
        {success && !error && (
          <p className="mt-2 text-xs text-success flex items-center gap-1">
            <Check className="h-3 w-3" />
            {success}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Select component with same styling
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  variant?: 'default' | 'filled' | 'outline';
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, error, success, variant = 'default', options, placeholder, id, ...props }, ref) => {
    const inputId = id || props.name || `select-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-2 text-sm font-semibold text-foreground"
          >
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <div
          className={cn(
            'relative rounded-xl border transition-all duration-200',
            variants[variant],
            error && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20 hover:border-destructive',
            success && 'border-success focus-within:border-success focus-within:ring-success/20 hover:border-success',
          )}
        >
          <select
            id={inputId}
            ref={ref}
            className={cn(
              'w-full bg-transparent outline-none appearance-none cursor-pointer',
              'text-foreground px-4 py-3 pr-10',
              'rounded-xl',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="text-muted-foreground">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="bg-card text-foreground"
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
            <svg
              className="h-5 w-5 text-muted-foreground"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        {hint && !error && !success && (
          <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
        )}
        {error && (
          <p className="mt-2 text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
        {success && !error && (
          <p className="mt-2 text-xs text-success flex items-center gap-1">
            <Check className="h-3 w-3" />
            {success}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

// Checkbox with label
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const inputId = id || props.name || `checkbox-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="flex items-start gap-3">
        <input
          id={inputId}
          ref={ref}
          type="checkbox"
          className={cn(
            'h-5 w-5 rounded border-border bg-card text-primary',
            'focus:ring-2 focus:ring-primary/20 focus:ring-offset-0',
            'transition-colors cursor-pointer',
            'checked:bg-primary checked:border-primary',
            className
          )}
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label htmlFor={inputId} className="text-sm font-medium text-foreground cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <span className="text-xs text-muted-foreground mt-0.5">{description}</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// Radio with label
export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const inputId = id || `radio-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="flex items-start gap-3">
        <input
          id={inputId}
          ref={ref}
          type="radio"
          className={cn(
            'h-5 w-5 border-border bg-card text-primary',
            'focus:ring-2 focus:ring-primary/20 focus:ring-offset-0',
            'transition-colors cursor-pointer',
            'checked:border-primary',
            className
          )}
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label htmlFor={inputId} className="text-sm font-medium text-foreground cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <span className="text-xs text-muted-foreground mt-0.5">{description}</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export default Input;
