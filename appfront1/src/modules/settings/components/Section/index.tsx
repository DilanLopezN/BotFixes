import styled from 'styled-components';

const Section = styled.div`
    width: 100%;
    padding: 15px 25px 20px 25px;
    border-radius: 7px;
    background: #FFF;

    -webkit-box-shadow: rgba(71, 88, 114, 0.08) 0px 2px 2px;
    -moz-box-shadow: rgba(71, 88, 114, 0.08) 0px 2px 2px;
    box-shadow: rgba(71, 88, 114, 0.08) 0px 2px 2px;
    transition: box-shadow 0.3s;

  &:hover {
    -webkit-box-shadow: 0px 2px 12px -5px rgba(143, 143, 143, 0.83);
    -moz-box-shadow: 0px 2px 12px -5px rgba(143, 143, 143, 0.83);
    box-shadow: 0px 2px 12px -5px rgba(143, 143, 143, 0.83);
    transition: box-shadow 0.3s ease-in-out;
  }
`;

export {
    Section
}