/**
 * Advanced Filter Builder Component Tests
 * Story 2.3: Advanced Filtering & Cross-Filtering
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { AdvancedFilterBuilder } from '../AdvancedFilterBuilder';
import { FilterConfig, FilterOperator, LogicalOperator } from '../../../stores/filtersSlice';

describe('AdvancedFilterBuilder', () => {
  const mockAvailableFields = [
    { name: 'name', type: 'string' as const },
    { name: 'age', type: 'number' as const },
    { name: 'email', type: 'string' as const },
    { name: 'created_at', type: 'date' as const },
    { name: 'is_active', type: 'boolean' as const },
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('should render empty state when no predicates', () => {
    const value: FilterConfig = {
      operator: LogicalOperator.AND,
      predicates: [],
    };

    render(
      <AdvancedFilterBuilder
        value={value}
        onChange={mockOnChange}
        availableFields={mockAvailableFields}
      />
    );

    expect(screen.getByText(/No filters applied/i)).toBeInTheDocument();
    expect(screen.getByText(/Click "Add Filter" to get started/i)).toBeInTheDocument();
  });

  it('should render filter count badge', () => {
    const value: FilterConfig = {
      operator: LogicalOperator.AND,
      predicates: [
        {
          field: 'name',
          operator: FilterOperator.EQ,
          value: 'John',
        },
        {
          field: 'age',
          operator: FilterOperator.GT,
          value: 18,
        },
      ],
    };

    render(
      <AdvancedFilterBuilder
        value={value}
        onChange={mockOnChange}
        availableFields={mockAvailableFields}
      />
    );

    expect(screen.getByText('2 filters')).toBeInTheDocument();
  });

  it('should call onChange when adding a filter', () => {
    const value: FilterConfig = {
      operator: LogicalOperator.AND,
      predicates: [],
    };

    render(
      <AdvancedFilterBuilder
        value={value}
        onChange={mockOnChange}
        availableFields={mockAvailableFields}
      />
    );

    const addButton = screen.getByRole('button', { name: /Add Filter/i });
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalledWith({
      operator: LogicalOperator.AND,
      predicates: [
        {
          field: 'name',
          operator: FilterOperator.EQ,
          value: '',
        },
      ],
    });
  });

  it('should call onChange when clearing all filters', () => {
    const value: FilterConfig = {
      operator: LogicalOperator.AND,
      predicates: [
        {
          field: 'name',
          operator: FilterOperator.EQ,
          value: 'John',
        },
      ],
    };

    render(
      <AdvancedFilterBuilder
        value={value}
        onChange={mockOnChange}
        availableFields={mockAvailableFields}
      />
    );

    const clearButton = screen.getByRole('button', { name: /Clear All/i });
    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith({
      operator: LogicalOperator.AND,
      predicates: [],
    });
  });

  it('should show logical operator selector when multiple predicates', () => {
    const value: FilterConfig = {
      operator: LogicalOperator.AND,
      predicates: [
        {
          field: 'name',
          operator: FilterOperator.EQ,
          value: 'John',
        },
        {
          field: 'age',
          operator: FilterOperator.GT,
          value: 18,
        },
      ],
    };

    render(
      <AdvancedFilterBuilder
        value={value}
        onChange={mockOnChange}
        availableFields={mockAvailableFields}
      />
    );

    expect(screen.getByLabelText(/Match/i)).toBeInTheDocument();
    expect(screen.getByText(/All conditions must be true/i)).toBeInTheDocument();
  });

  it('should call onChange when changing logical operator', () => {
    const value: FilterConfig = {
      operator: LogicalOperator.AND,
      predicates: [
        {
          field: 'name',
          operator: FilterOperator.EQ,
          value: 'John',
        },
        {
          field: 'age',
          operator: FilterOperator.GT,
          value: 18,
        },
      ],
    };

    render(
      <AdvancedFilterBuilder
        value={value}
        onChange={mockOnChange}
        availableFields={mockAvailableFields}
      />
    );

    const operatorSelect = screen.getByLabelText(/Match/i);
    fireEvent.mouseDown(operatorSelect);

    const orOption = screen.getByRole('option', { name: /Any \(OR\)/i });
    fireEvent.click(orOption);

    expect(mockOnChange).toHaveBeenCalledWith({
      operator: LogicalOperator.OR,
      predicates: value.predicates,
    });
  });

  it('should show AND/OR dividers between predicates', () => {
    const value: FilterConfig = {
      operator: LogicalOperator.AND,
      predicates: [
        {
          field: 'name',
          operator: FilterOperator.EQ,
          value: 'John',
        },
        {
          field: 'age',
          operator: FilterOperator.GT,
          value: 18,
        },
      ],
    };

    render(
      <AdvancedFilterBuilder
        value={value}
        onChange={mockOnChange}
        availableFields={mockAvailableFields}
      />
    );

    const andChips = screen.getAllByText('AND');
    expect(andChips.length).toBeGreaterThan(0);
  });

  it('should disable add button when no fields available', () => {
    const value: FilterConfig = {
      operator: LogicalOperator.AND,
      predicates: [],
    };

    render(
      <AdvancedFilterBuilder
        value={value}
        onChange={mockOnChange}
        availableFields={[]}
      />
    );

    const addButton = screen.getByRole('button', { name: /Add Filter/i });
    expect(addButton).toBeDisabled();
  });

  it('should show summary with filter count and logic', () => {
    const value: FilterConfig = {
      operator: LogicalOperator.OR,
      predicates: [
        {
          field: 'name',
          operator: FilterOperator.EQ,
          value: 'John',
        },
        {
          field: 'age',
          operator: FilterOperator.GT,
          value: 18,
        },
      ],
    };

    render(
      <AdvancedFilterBuilder
        value={value}
        onChange={mockOnChange}
        availableFields={mockAvailableFields}
      />
    );

    expect(screen.getByText(/Active Filters:/i)).toBeInTheDocument();
    expect(screen.getByText(/2 conditions using/i)).toBeInTheDocument();
    expect(screen.getByText(/OR/i)).toBeInTheDocument();
  });
});

