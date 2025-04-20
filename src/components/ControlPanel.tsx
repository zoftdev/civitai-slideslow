import React, { useState } from 'react';
import styled from 'styled-components';

const ControlPanelContainer = styled.div<{ isVisible: boolean }>`
  position: fixed;
  top: 0;
  right: ${props => props.isVisible ? '0' : '-250px'};
  width: 250px;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  transition: right 0.3s ease;
`;

interface ToggleButtonProps {
  isVisible: boolean;
}

const ToggleButton = styled.button<ToggleButtonProps>`
  position: fixed;
  top: 10px;
  right: ${props => props.isVisible ? '260px' : '10px'};
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  border: none;
  border-radius: 4px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 101;
  transition: right 0.3s ease;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.9);
  }

  svg {
    width: 20px;
    height: 20px;
    fill: white;
  }
`;

const PanelHeader = styled.h2`
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  border-bottom: 1px solid #444;
  padding-bottom: 10px;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
`;

const InlineGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Input = styled.input`
  background-color: #333;
  border: 1px solid #555;
  color: white;
  padding: 8px;
  border-radius: 4px;
  
  &:focus {
    outline: none;
    border-color: #777;
  }
`;

const NumberInput = styled.input`
  background-color: #333;
  border: 1px solid #555;
  color: white;
  padding: 8px;
  border-radius: 4px;
  width: 60px;
  
  &:focus {
    outline: none;
    border-color: #777;
  }
`;

const SmallButton = styled.button`
  background-color: #444;
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    background-color: #555;
  }
`;

const SmallButtonDisabled = styled(SmallButton)`
  opacity: 0.5;
  cursor: not-allowed;
  
  &:hover {
    background-color: #444;
  }
`;

const RangeInput = styled.input`
  width: 100%;
  background-color: #333;
  accent-color: #555;
  
  &:focus {
    outline: none;
  }
`;

const RangeValue = styled.div`
  font-size: 0.8rem;
  text-align: right;
  color: #ccc;
  margin-top: 4px;
`;

const Select = styled.select`
  background-color: #333;
  border: 1px solid #555;
  color: white;
  padding: 8px;
  border-radius: 4px;
  
  &:focus {
    outline: none;
    border-color: #777;
  }
`;

const Button = styled.button`
  background-color: #444;
  border: none;
  color: white;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  
  &:hover {
    background-color: #555;
  }
`;

const PageMessage = styled.div`
  font-size: 0.8rem;
  color: #aaa;
  margin-top: 4px;
  text-align: center;
`;

const Separator = styled.div`
  height: 1px;
  background-color: #444;
  margin: 5px 0;
`;

// SVG icons
const IconOpen = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M10.59 4.59C10.21 4.21 9.7 4 9.17 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-1.41-1.41z"/>
  </svg>
);

const IconClose = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
);

// Define types to match those in Slideshow and civitaiService
type SortType = 'Most Reactions' | 'Most Comments' | 'Newest';
type PeriodType = 'AllTime' | 'Year' | 'Month' | 'Week' | 'Day';

interface ControlPanelProps {
  nsfw: boolean;
  setNsfw: (value: boolean) => void;
  mediaType: string;
  setMediaType: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  delaySeconds: number;
  setDelaySeconds: (value: number) => void;
  sort: SortType;
  setSort: (value: SortType) => void;
  period: PeriodType;
  setPeriod: (value: PeriodType) => void;
  onApplyFilters: () => void;
  isVisible: boolean;
  toggleVisibility: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  nsfw,
  setNsfw,
  mediaType,
  setMediaType,
  searchTerm,
  setSearchTerm,
  delaySeconds,
  setDelaySeconds,
  sort,
  setSort,
  period,
  setPeriod,
  onApplyFilters,
  isVisible,
  toggleVisibility
}) => {
  return (
    <>
      <ToggleButton onClick={toggleVisibility} isVisible={isVisible}>
        {isVisible ? <IconClose /> : <IconOpen />}
      </ToggleButton>
      
      <ControlPanelContainer isVisible={isVisible}>
        <PanelHeader>Control Panel</PanelHeader>
        
        <ControlGroup>
          <Label>
            <input
              type="checkbox"
              checked={nsfw}
              onChange={(e) => setNsfw(e.target.checked)}
            />
            Allow NSFW Content
          </Label>
        </ControlGroup>
        
        <ControlGroup>
          <Label htmlFor="mediaType">Media Type</Label>
          <Select
            id="mediaType"
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value)}
          >
            <option value="all">All Media</option>
            <option value="image">Images Only</option>
            <option value="video">Videos Only</option>
          </Select>
        </ControlGroup>
        
        <ControlGroup>
          <Label htmlFor="sort">Sort By</Label>
          <Select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
          >
            <option value="Most Reactions">Most Reactions</option>
            <option value="Most Comments">Most Comments</option>
            <option value="Newest">Newest</option>
          </Select>
        </ControlGroup>
        
        <ControlGroup>
          <Label htmlFor="period">Time Period</Label>
          <Select
            id="period"
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodType)}
          >
            <option value="AllTime">All Time</option>
            <option value="Day">Last 24 Hours</option>
            <option value="Week">Last Week</option>
            <option value="Month">Last Month</option>
            <option value="Year">Last Year</option>
          </Select>
        </ControlGroup>
        
        <ControlGroup>
          <Label htmlFor="searchTerm">Search</Label>
          <Input
            id="searchTerm"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search term..."
          />
        </ControlGroup>
        
        <ControlGroup>
          <Label htmlFor="delay">Slideshow Delay (seconds)</Label>
          <Input
            id="delay"
            type="number"
            min="1"
            max="60"
            value={delaySeconds}
            onChange={(e) => setDelaySeconds(Number(e.target.value))}
          />
        </ControlGroup>
        
        <Button onClick={onApplyFilters}>
          Apply Filters
        </Button>
      </ControlPanelContainer>
    </>
  );
};

export default ControlPanel; 