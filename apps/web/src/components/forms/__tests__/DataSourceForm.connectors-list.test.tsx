import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataSourceForm } from '../DataSourceForm';

describe('DataSourceForm connectors list', () => {
  it('renders additional connector types as disabled', () => {
    render(
      <DataSourceForm
        open={true}
        onClose={() => {}}
        onSubmit={async () => {}}
        mode="create"
      />
    );

    // open the select (MUI requires clicking label or select)
    const typeLabel = screen.getByLabelText('Type');
    fireEvent.mouseDown(typeLabel);

    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    expect(screen.getByText('MySQL (coming soon)')).toBeInTheDocument();
    expect(screen.getByText('SQL Server (coming soon)')).toBeInTheDocument();
    expect(screen.getByText('Oracle (coming soon)')).toBeInTheDocument();
    expect(screen.getByText('MongoDB (coming soon)')).toBeInTheDocument();
    expect(screen.getByText('Cassandra (coming soon)')).toBeInTheDocument();
    expect(screen.getByText('ClickHouse (coming soon)')).toBeInTheDocument();
  });
});

