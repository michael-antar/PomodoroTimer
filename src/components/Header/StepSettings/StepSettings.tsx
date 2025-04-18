import './StepSettings.css'

import { useState, useRef, useEffect } from 'react';

import Button from '../../Button/Button';
import DurationInput from './DurationInput/DurationInput';

import plusIcon from '../../../assets/plusIcon.svg';
import dragIcon from '../../../assets/dragIcon.svg';
import trashIcon from '../../../assets/trashIcon.svg';

import type { Step } from '../../../types';

interface StepSettingsProps {
    steps: Step[];
    stepColors: {work: string, break: string};
    onAdd: (name: string) => void;
    onReorder: (newSteps: Step[]) => void;
    onChangeDuration: (stepId: number, duration: number) => void;
    onRemove: (removedId: number) => void;
};

export default function StepSettings({
    steps,
    stepColors,
    onAdd,
    onReorder,
    onChangeDuration,
    onRemove,
} : StepSettingsProps) {

    const [currentSteps, setCurrentSteps] = useState<Step[]>(steps);

    const draggedItemId = useRef<number | null>(null);
    const dragOverItemId = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const indicatorElementRef = useRef<HTMLElement | null>(null);

    // --- Remove Handler ---
    const handleRemoveStep = (removeId: number) => {
        if (steps.length > 1) {
            onRemove(removeId);
        }
        else {
            alert('Cannot remove last step');
        }
    };

    // --- Drag and Drop Handlers ---

    // Triggered when dragging starts on the icon (img)
    const handleDragStart = (e: React.DragEvent<HTMLImageElement>, item: Step) => {
        draggedItemId.current = item.id;
        // Change opacity of parent
        const parentDiv = e.currentTarget.closest('.stepSettingsItem') as HTMLElement | null;
        if (parentDiv) {
            try {
                e.dataTransfer.setDragImage(parentDiv, 10, 10);
            }
            catch (error) {
                console.warn("setDragImage failed:", error);
            }

            setTimeout(() => {
                if (parentDiv && draggedItemId.current === item.id) parentDiv.style.opacity = '0.4';
            }, 0);
        }

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id.toString())
    };

    const clearIndicator = () => {
        if (indicatorElementRef.current) {
            indicatorElementRef.current.classList.remove('dragAboveIndicator');
            indicatorElementRef.current.classList.remove('dragBelowIndicator');
            indicatorElementRef.current = null;
            dragOverItemId.current = null
        }
        // Fallback: Clear any indicators that might have been missed
        containerRef.current?.querySelectorAll('.dragAboveIndicator').forEach(el => {
            el.classList.remove('dragAboveIndicator');
        });
        containerRef.current?.querySelectorAll('.dragBelowIndicator').forEach(el => {
            el.classList.remove('dragBelowIndicator');
        });
    };

    // Triggered when dragging enters a drop target
    // Remove all indicators, then add indicator to target
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, targetItem: Step) => {
        e.preventDefault();
        const currentTargetElement = e.currentTarget as HTMLElement;
        const targetId = targetItem.id;

        if (draggedItemId.current === null || targetId === draggedItemId.current) {
            if (indicatorElementRef.current && indicatorElementRef.current !== currentTargetElement) {
                clearIndicator();
            }
        }

        if (targetId !== dragOverItemId.current) {
            clearIndicator();

            const items = Array.from(currentSteps);
            const draggedIndex = items.findIndex(step => step.id === draggedItemId.current);
            const targetIndex = items.findIndex(step => step.id === targetId);

            currentTargetElement.classList.add(draggedIndex < targetIndex ? 'dragBelowIndicator' : 'dragAboveIndicator')
            indicatorElementRef.current = currentTargetElement;
            dragOverItemId.current = targetId;
        }
    };

    // Triggered continuously while dragging over a drop target
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    // Triggered when dropping onto a drop target
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        clearIndicator();

        const sourceItemId = draggedItemId.current;
        const targetItemId = parseInt(e.currentTarget.id.split('-')[1]);

        if (sourceItemId !== null) {
            const originalDraggedElement = containerRef.current?.querySelector(`#step-${sourceItemId}`) as HTMLElement | null;
            if (originalDraggedElement) originalDraggedElement.style.opacity = '1';
        }

        // Prevent drop on self or ids are missing
        if (sourceItemId === null || targetItemId === null || sourceItemId === targetItemId) {
            console.log("Drop cancelled: same item or missing refs.");
            draggedItemId.current = null;
            return;
        }

        const items = Array.from(currentSteps);
        const draggedIndex = items.findIndex(step => step.id === sourceItemId);
        const targetIndex = items.findIndex(step => step.id === targetItemId);

        const [reorderedItem] = items.splice(draggedIndex, 1);
        items.splice(targetIndex, 0, reorderedItem);

        // Update local state for immediate UI feedback
        setCurrentSteps(items);

        // Notify parent component
        onReorder(items);

        draggedItemId.current = null;
        dragOverItemId.current = null;
    }

    // Triggered when dragging ends on the icon
    const handleDragEnd = (e: React.DragEvent<HTMLImageElement>) => {

        // Reset opacity of parent
        const parentDiv = e.currentTarget.closest('.stepSettingsItem') as HTMLElement | null;
        if (parentDiv) {
            parentDiv.style.opacity = '1';
        }

        clearIndicator();
        draggedItemId.current = null;
    };

    useEffect(() => {
        setCurrentSteps(steps);
    }, [steps]);

    return (
        <div className='settingsSection'>
            <div className='settingsHeading settingsHeading2'>Edit and Rearrange Steps</div>
            <div className='stepSettingsButtonContainer'>
                {/* Add Work Step Button */}
                <Button
                    onClick={() => onAdd('work')}
                    tooltip='Add work step'
                    className='stepSettingsButton'
                    style={{backgroundColor: stepColors['work']}}
                >
                    <img
                        className='stepSettingsButtonIcon'
                        src={plusIcon}
                        alt='Add work step'
                        draggable='false'
                    />
                </Button>
                {/* Add Break Step Button */}
                <Button
                    onClick={() => onAdd('break')}
                    tooltip='Add break step'
                    className='stepSettingsButton'
                    style={{backgroundColor: stepColors['break']}}
                >
                    <img
                        className='stepSettingsButtonIcon'
                        src={plusIcon}
                        alt='Add break step'
                        draggable='false'
                    />
                </Button>
            </div>
            <div className='stepSettingsItemContainer'>
                {currentSteps.map((step) => (
                    <div
                        key={step.id}
                        id={`step-${step.id}`}
                        className='stepSettingsItem'
                        style={{backgroundColor: stepColors[step.type as keyof typeof stepColors]}}

                        draggable={true}

                        onDragEnter={(e) => handleDragEnter(e, step)}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}

                        // Prevents drag start unless clicking the drag handle
                        onDragStartCapture={(e) => {
                            const isTargetHandle = 
                                (e.target as HTMLElement).tagName.toUpperCase() === 'IMG' 
                                && (e.target as HTMLElement).closest('.stepSettingsItem') === e.currentTarget;

                            if (!isTargetHandle) {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        }}
                    >

                        {/* Drag Handle */}
                        <img
                            src={dragIcon}
                            alt='Drag Handle'
                            onDragStart={(e) => handleDragStart(e, step)}
                            onDragEnd={handleDragEnd}
                        />

                        {/* Step Type */}
                        <span className='stepSettingsItemName'>{step.type}</span>

                        {/* Duration Input */}
                        <label>
                            Duration:
                            <DurationInput
                                stepId={step.id}
                                initialDuration={step.duration}
                                onChangeDuration={onChangeDuration}
                                name={`durationInput${step.id}`}
                            />
                        </label>

                        {/* Remove Step */}
                        <img
                            src={trashIcon}
                            alt='Remove Step'
                            onClick={() => handleRemoveStep(step.id)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}