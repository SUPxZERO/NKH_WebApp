export interface AutoTableOptions {
  startY?: number;
  margin?: { top?: number; left?: number; right?: number; bottom?: number };

  head?: any[][];
  body?: any[][];

  theme?: 'striped' | 'grid' | 'plain';

  styles?: {
    fontSize?: number;
    cellPadding?: number;
    lineWidth?: number;
    fillColor?: number[];      // <--- add
    textColor?: number[];      // <--- add
    halign?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
    fontStyle?: 'bold' | 'normal';
  };

  headStyles?: {
    fontSize?: number;
    fontStyle?: 'bold' | 'normal';
    fillColor?: number[];      // <--- this fixes your issue
    textColor?: number[];      // <--- optional but recommended
    halign?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
  };
}
