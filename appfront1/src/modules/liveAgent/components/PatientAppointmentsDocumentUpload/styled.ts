import styled from 'styled-components';

export const SideModalContainer = styled.div`
    height: 100%;
    width: 300px;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-left: 1px solid #e0e0e0;
    position: relative;
    font-size: 12px;
`;

export const CloseButton = styled.i`
    position: absolute;
    top: 48px;
    right: 8px;
    cursor: pointer;
    font-size: 16px;
    color: #666;
    background: #f5f5f5;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    transition: all 0.2s ease;
    
    &:hover {
        background: #333;
        color: white;
    }
`;

export const Content = styled.div`
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    
    &::-webkit-scrollbar {
        width: 4px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: #ddd;
        border-radius: 2px;
    }
`;

export const SectionTitle = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
`;

export const AppointmentsList = styled.div`
    margin-bottom: 16px;
    
    p {
        color: #888;
        font-size: 11px;
        text-align: center;
        margin: 20px 0;
        font-style: italic;
    }
`;

export const AppointmentCard = styled.div`
    background: #ffffff;
    color: #333;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 6px;
    transition: all 0.2s ease;
    
    &:hover {
        border-color: #999;
        background: #f8f8f8;
    }
`;

export const AppointmentInfo = styled.div`
    .appointment-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 4px;
        
        strong {
            font-size: 12px;
            font-weight: 600;
            color: #333;
        }
        
        .sent-tag {
            background: #e8f5e8;
            color: #2e7d32;
            font-size: 9px;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 8px;
            text-transform: uppercase;
            border: 1px solid #c8e6c9;
        }
    }
    
    div {
        font-size: 11px;
        margin-bottom: 2px;
        color: #666;
        line-height: 1.3;
    }
`;

export const UploadSection = styled.div`
    background: #f8f8f8;
    border-radius: 4px;
    padding: 16px;
    border: 1px solid #e0e0e0;
`;

export const FileInput = styled.input`
    width: 100%;
    padding: 4px 6px;
    border: 1px dashed #ccc;
    border-radius: 3px;
    margin-bottom: 6px;
    font-size: 10px;
    background: #ffffff;
    transition: all 0.2s ease;
    
    &:focus {
        border-color: #666;
        outline: none;
    }
    
    &:hover {
        border-color: #999;
    }
`;

export const DocumentTypeSelect = styled.select`
    width: 100%;
    padding: 4px 6px;
    border: 1px solid #ccc;
    border-radius: 3px;
    margin-bottom: 6px;
    font-size: 11px;
    background: #ffffff;
    transition: all 0.2s ease;
    
    &:focus {
        border-color: #666;
        outline: none;
    }
`;

export const UploadButton = styled.button`
    width: 100%;
    padding: 4px 8px;
    background: #333;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    transition: all 0.2s ease;
    
    &:hover:not(:disabled) {
        background: #555;
    }
    
    &:disabled {
        background: #ccc;
        cursor: not-allowed;
    }
`;

export const UploadButtonContainer = styled.div`
    margin-top: 4px;
    margin-bottom: 8px;
`;

export const UploadActionButton = styled.button<{ isSuccess?: boolean }>`
    width: 100%;
    padding: 4px 8px;
    background: ${props => props.isSuccess ? '#4caf50' : '#42a5f5'};
    color: white;
    border: 1px solid ${props => props.isSuccess ? '#4caf50' : '#42a5f5'};
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    
    ${props => props.isSuccess && `
        &::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shimmer 0.6s ease-out;
        }
        
        @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
        }
    `}
    
    &:hover:not(:disabled) {
        background: ${props => props.isSuccess ? '#45a049' : '#2196f3'};
        color: white;
    }
    
    &:disabled {
        background: #f8f8f8;
        color: #ccc;
        cursor: not-allowed;
        opacity: 0.6;
    }
`;

export const UploadPopover = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 260px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 6px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 1000;
`;

export const PopoverHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid #e0e0e0;
    background: #f8f8f8;
    border-radius: 8px 8px 0 0;
`;

export const PopoverTitle = styled.h4`
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: #333;
`;

export const PopoverClose = styled.i`
    cursor: pointer;
    font-size: 12px;
    color: #666;
    
    &:hover {
        color: #333;
    }
`;

export const PopoverContent = styled.div`
    padding: 12px;
`;

export const AppointmentSummary = styled.div`
    background: #f8f8f8;
    padding: 6px 8px;
    border-radius: 3px;
    margin-bottom: 8px;
    border: 1px solid #e0e0e0;
    
    strong {
        display: block;
        font-size: 12px;
        color: #333;
        margin-bottom: 1px;
    }
    
    div {
        font-size: 11px;
        color: #666;
    }
`;

export const PopoverActions = styled.div`
    display: flex;
    gap: 6px;
    margin-top: 8px;
`;

export const PopoverCancelButton = styled.button`
    flex: 1;
    padding: 4px 8px;
    background: transparent;
    color: #666;
    border: 1px solid #ccc;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
    transition: all 0.2s ease;
    
    &:hover {
        background: #f0f0f0;
    }
`;

export const UseCurrentImageSection = styled.div`
    margin-bottom: 8px;
`;

export const UseCurrentImageButton = styled.button<{ selected?: boolean }>`
    width: 100%;
    padding: 6px 8px;
    background: ${props => props.selected ? '#e3f2fd' : '#f8f9fa'};
    color: ${props => props.selected ? '#1976d2' : '#333'};
    border: 1px solid ${props => props.selected ? '#1976d2' : '#ddd'};
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
    text-align: left;
    
    &:hover {
        background: ${props => props.selected ? '#e3f2fd' : '#e8f4fd'};
        border-color: #1976d2;
    }
`;

export const SelectedFileInfo = styled.div`
    font-size: 11px;
    color: #666;
    margin-bottom: 6px;
    padding: 4px 6px;
    background: #f0f8ff;
    border-radius: 3px;
    border: 1px solid #ddd;
`;

export const AppointmentsHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
`;

export const RefreshButton = styled.button`
    padding: 2px 6px;
    background: transparent;
    color: #666;
    border: 1px solid #ddd;
    border-radius: 3px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
    min-width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover:not(:disabled) {
        background: #f0f0f0;
        color: #333;
        border-color: #999;
    }
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    &:disabled:hover {
        background: transparent;
    }
`;

export const DocumentsList = styled.div`
    margin-top: 16px;
    
    small {
        color: #888;
        font-size: 10px;
        font-style: italic;
        display: block;
        text-align: center;
        margin-top: 4px;
    }
`;

export const DocumentItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background: #ffffff;
    border-radius: 4px;
    margin-bottom: 4px;
    border: 1px solid #e0e0e0;
    
    span {
        color: #333;
        font-weight: 500;
        font-size: 10px;
        display: flex;
        align-items: center;
        gap: 4px;
    }
    
    small {
        color: #888;
        font-size: 9px;
    }
`;

export const ManualInputSection = styled.div`
    margin-bottom: 8px;
`;

export const ManualInputContainer = styled.div`
    display: flex;
    gap: 4px;
    align-items: center;
    background: #f8f8f8;
    border: 1px solid #e0e0e0;
    border-radius: 3px;
    padding: 4px;
    transition: all 0.2s ease;
    
    &:focus-within {
        border-color: #666;
        background: #ffffff;
    }
    
    &:hover {
        border-color: #999;
    }
`;

export const PatientCodeInput = styled.input`
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 11px;
    padding: 2px 4px;
    color: #333;
    
    &::placeholder {
        color: #999;
        font-style: italic;
    }
`;

export const SearchButton = styled.button`
    padding: 4px 8px;
    background: transparent;
    color: #666;
    border: none;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    transition: all 0.2s ease;
    border-radius: 2px;
    
    &:hover:not(:disabled) {
        background: #333;
        color: white;
    }
    
    &:disabled {
        color: #ccc;
        cursor: not-allowed;
        opacity: 0.6;
    }
`;

export const PatientNameDisplay = styled.div`
    margin-top: 4px;
    margin-bottom: 12px;
    padding: 4px 8px;
    background: #e8f5e8;
    border: 1px solid #c8e6c9;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 500;
    color: #2e7d32;
    text-align: center;
    
    &:empty {
        display: none;
    }
`;

export const BlockedSection = styled.div`
    background: #f8f8f8;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 20px;
    margin-bottom: 16px;
    text-align: center;
    
    .icon {
        font-size: 20px;
        color: #666;
        margin-bottom: 8px;
    }
    
    h4 {
        margin: 0 0 8px 0;
        font-size: 13px;
        font-weight: 600;
        color: #333;
    }
    
    p {
        margin: 0;
        font-size: 11px;
        color: #666;
        line-height: 1.5;
    }
`;

export const StatusLoadingSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    
    p {
        margin-top: 8px;
        font-size: 11px;
        color: #666;
        text-align: center;
    }
`;