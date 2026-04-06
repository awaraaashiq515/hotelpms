import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  action?: React.ReactNode; // Aliased for convenience
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions, action }) => {
  const finalActions = actions || action;
  
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
        {description && <p className="text-gray-500 font-medium">{description}</p>}
      </div>
      {finalActions && (
        <div className="flex items-center gap-3">
          {finalActions}
        </div>
      )}
    </div>
  );
};
