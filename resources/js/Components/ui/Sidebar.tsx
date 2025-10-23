import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./Button"
import { ScrollArea } from "./ScrollArea"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  isCollapsed?: boolean
  children?: React.ReactNode
}

export function Sidebar({ className, isCollapsed, children }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border/50 bg-card/95 backdrop-blur-lg transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      <ScrollArea className="h-full w-full">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <div className="mt-3 space-y-1">{children}</div>
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}

interface SidebarItemProps {
  icon?: React.ReactNode
  title: string
  isCollapsed?: boolean
  href?: string
  isActive?: boolean
  onClick?: () => void
  badge?: string | number
}

export function SidebarItem({
  icon,
  title,
  isCollapsed,
  href,
  isActive,
  onClick,
  badge,
}: SidebarItemProps) {
  const Comp = href ? "a" : "button"
  
  return (
    <Comp
      href={href}
      onClick={onClick}
      className={cn(
        "group flex w-full items-center rounded-md border border-transparent px-3 py-2 hover:bg-accent text-sm font-medium transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:text-accent-foreground",
        isCollapsed ? "justify-center" : "justify-start"
      )}
    >
      {icon && (
        <span
          className={cn(
            "mr-2 h-4 w-4",
            isActive ? "text-accent-foreground" : "text-muted-foreground group-hover:text-accent-foreground",
            isCollapsed ? "mr-0" : "mr-2"
          )}
        >
          {icon}
        </span>
      )}
      {!isCollapsed && <span>{title}</span>}
      {!isCollapsed && badge && (
        <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs font-normal text-primary">
          {badge}
        </span>
      )}
    </Comp>
  )
}

export function SidebarToggle({
  isCollapsed,
  onToggle,
}: {
  isCollapsed: boolean
  onToggle: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute -right-4 top-4 z-50 h-8 w-8 rounded-full border border-border/50 bg-background shadow-md"
      onClick={onToggle}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4 transition-transform duration-200"
        style={{
          transform: `rotate(${isCollapsed ? 0 : 180}deg)`,
        }}
      >
        <path
          fillRule="evenodd"
          d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
          clipRule="evenodd"
        />
      </svg>
    </Button>
  )
}