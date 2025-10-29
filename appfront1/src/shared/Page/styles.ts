import styled from 'styled-components';

const Content = styled.div`
    height: 100vh;
    width: 100%;
`;

const SideMenu = styled.div`
    width: 60px;
    min-width: 60px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 0 0 10px 0;
`;

const OptionItem = styled.div<{ selected?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 42px;
    margin: 7px;
    border-radius: 5px;
    cursor: pointer;

    ${(props) =>
        props.selected &&
        `
        background: #ebebeb26;
    `}    
`;

const OptionItemWithLabel = styled(OptionItem)<{ selected?: boolean }>`
    flex-direction: column;
    height: 58px;

    .title {
        color: #fff;
        font-size: 10px;
        text-align: center;
        overflow: hidden;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
    }
`;

const TopLevelOptions = styled.div``;

const BottomLevelOptions = styled.div``;

const Header = styled.div`
    height: 60px;
    min-height: 60px;
    display: flex;
    padding: 0 20px;
    justify-content: space-between;
    flex: 1;
    align-items: center;
    width: 100%;

    img {
        height: 45px;
    }
`;

const ChildArea = styled.div`
    padding: 25px;
    width: 100%;
    overflow-y: auto;
    height: 100%;
    background: #f2f4f8;
`;

const ContentArea = styled.div`
    display: flex;
    height: 100vh;
`;

const LogoImage = styled.img`
    height: 36px;
`;

const LogoImageWrapper = styled.div`
    display: flex;
    justify-content: center;
    margin: 10px 0 15px 0;
`;

export {
    Content,
    SideMenu,
    Header,
    ChildArea,
    ContentArea,
    OptionItem,
    BottomLevelOptions,
    TopLevelOptions,
    LogoImage,
    LogoImageWrapper,
    OptionItemWithLabel,
};
