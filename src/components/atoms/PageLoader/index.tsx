import { Grid, Loading } from '@geist-ui/core';

const PageLoader = () => {
  return (
    <Grid.Container gap={3} marginTop={2} direction='column'>
      <Grid>
        <Loading type='success' spaceRatio={2} />
      </Grid>
      <Grid>
        <Loading type='secondary' spaceRatio={2} />
      </Grid>
      <Grid>
        <Loading type='warning' spaceRatio={2} />
      </Grid>
      <Grid>
        <Loading type='error' spaceRatio={2} />
      </Grid>
    </Grid.Container>
  );
};

export default PageLoader;
