import React, { useState, useEffect, memo } from 'react';
import { Header } from '@buffetjs/custom';
import { Table } from '@buffetjs/core';
import styled from 'styled-components';
import axios from 'axios';

const Wrapper = styled.div`
  padding: 18px 30px;

  p {
    margin-top: 1rem;
  }
`

const HomePage = () => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    axios.get('https://api.github.com/users/React-avancado/repos')
    .then((res) => setRows(res.data))
    .catch((error) => strapi.notification.error('Oos...github API limit exceeded'))
  }, [])

  const headers = [
    {
      name: 'Name',
      value: 'name',
    },
    {
      name: 'Description',
      value: 'description',
    },
    {
      name: 'Url',
      value: 'html_url',
    },
  ];
 

  return (
    <Wrapper>
      <Header 
         title={{ label: 'React Avançado Repositories' }}
         content='A list of our repositories in React Avançado course.'
      />
      <Table headers={headers} rows={rows} />
    </Wrapper>
  );
};

const rows_static = [
  {
    id: 1,
    name: 'landing-page',
    description: 'Code to the sales landing page.',
    html_url: 'https://github.com/React-Avancado/landing-page',
  },
  {
    id: 2,
    name: 'links-estudo',
    description: 'Links interessantes sobre tudo abordado no curso.',
    html_url: 'https://github.com/React-Avancado/links-estudo',
  },
  {
    id: 3,
    name: 'boilerplate',
    description: 'Boilerplate to use in our React Avançado course.',
    html_url: 'https://github.com/React-Avancado/boilerplate',
  },
];

export default memo(HomePage);
