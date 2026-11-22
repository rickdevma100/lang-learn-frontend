import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NODE_ENV = 'test';
process.env.SCHOOL_API_URL = 'http://lang-learn-api:8000';
process.env.INFERENCE_API_URL = 'http://lang-learn-inference-predictor.lang-learn-platform.svc.cluster.local';
process.env.TENANT_NAMESPACE = 'school-berlin';

const { resolveApiTarget } = await import('../server.js');

test('routes non-LLM endpoints to school core API', () => {
  assert.equal(resolveApiTarget('/api/exam_saved_papers'), 'http://lang-learn-api:8000');
  assert.equal(resolveApiTarget('/api/pool_stats'), 'http://lang-learn-api:8000');
  assert.equal(resolveApiTarget('/api/tts'), 'http://lang-learn-api:8000');
  assert.equal(resolveApiTarget('/api/feedback'), 'http://lang-learn-api:8000');
  assert.equal(resolveApiTarget('/api/clear_cache'), 'http://lang-learn-api:8000');
});

test('routes LLM & streaming endpoints to shared platform inference', () => {
  assert.equal(
    resolveApiTarget('/api/scenario_dialogue_stream'),
    'http://lang-learn-inference-predictor.lang-learn-platform.svc.cluster.local'
  );
  assert.equal(
    resolveApiTarget('/api/explain_word_stream?word=Hund'),
    'http://lang-learn-inference-predictor.lang-learn-platform.svc.cluster.local'
  );
  assert.equal(
    resolveApiTarget('/api/practice_check'),
    'http://lang-learn-inference-predictor.lang-learn-platform.svc.cluster.local'
  );
  assert.equal(
    resolveApiTarget('/api/stt'),
    'http://lang-learn-inference-predictor.lang-learn-platform.svc.cluster.local'
  );
});
