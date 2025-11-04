#!/usr/bin/env node
// Unified test runner for the entire graph-project
// Runs all test suites: client (Jest), server interface, server component, and standalone tests

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..'); // Go up one level to project root

/**
 * Execute a command and return results
 */
function executeCommand(command, cwd, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 ${description}`);
    console.log(`${'='.repeat(60)}`);
    
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, code });
      } else {
        reject({ success: false, code, description });
      }
    });

    child.on('error', (error) => {
      reject({ success: false, error, description });
    });
  });
}

/**
 * Run client-side Jest tests
 */
async function runClientTests() {
  const clientDir = resolve(rootDir, 'client/graph-project-react-app');
  
  if (!existsSync(resolve(clientDir, 'package.json'))) {
    throw new Error('Client package.json not found');
  }

  return executeCommand(
    'npm test -- --watchAll=false --coverage=false',
    clientDir,
    'Running Client Tests (Jest + React Testing Library)'
  );
}

/**
 * Run server user-db-interface tests
 */
async function runInterfaceTests() {
  const interfaceDir = resolve(rootDir, '__tests__/server/interface');
  const serverDir = resolve(rootDir, 'server');
  const interfaceModuleDir = resolve(serverDir, 'user-db-interface');
  
  // Run from server directory with NODE_PATH set so modules resolve correctly
  return executeCommand(
    `NODE_PATH=${serverDir}/node_modules:${interfaceModuleDir}/node_modules node ../__tests__/server/interface/testRunner.js`,
    serverDir,
    'Running Server Interface Tests'
  );
}

/**
 * Run server user-db-component tests
 */
async function runComponentTests() {
  const componentDir = resolve(rootDir, '__tests__/server/component');
  const serverDir = resolve(rootDir, 'server');
  const tests = [
    'testAuth.js',
    'testFirestore.js',
    'testFolderValidation.js',
    'testPreferences.js',
    'testSavedPapers.js',
    'testUnauthorizedAccess.js'
  ];

  const results = [];
  for (const test of tests) {
    const testPath = resolve(componentDir, test);
    if (existsSync(testPath)) {
      try {
        // Run from server directory with NODE_PATH set so modules resolve correctly
        await executeCommand(
          `NODE_PATH=${serverDir}/node_modules node ../__tests__/server/component/${test}`,
          serverDir,
          `Running Component Test: ${test}`
        );
        results.push({ test, success: true });
      } catch (error) {
        results.push({ test, success: false, error });
      }
    }
  }

  return results;
}

/**
 * Run standalone client tests
 */
async function runStandaloneClientTests() {
  const clientTestsDir = resolve(rootDir, '__tests__/client/standalone');
  const clientDir = resolve(rootDir, 'client/graph-project-react-app');
  const tests = [
    'test-api-handler.js',
    'test-api-handler-interface.js',
    'cache-interface/test-cache-interface.js',
    'cache-db/test-firebase-cache.js'
  ];

  const results = [];
  for (const test of tests) {
    const testPath = resolve(clientTestsDir, test);
    if (existsSync(testPath)) {
      try {
        // Run from client directory so node_modules are accessible
        await executeCommand(
          `node ../../__tests__/client/standalone/${test}`,
          clientDir,
          `Running Standalone Test: ${test}`
        );
        results.push({ test, success: true });
      } catch (error) {
        results.push({ test, success: false, error });
      }
    }
  }

  return results;
}

/**
 * Main test runner
 */
async function runAllTests() {
  const startTime = Date.now();
  const results = {
    client: null,
    interface: null,
    component: [],
    standalone: [],
    errors: []
  };

  console.log('\n' + '='.repeat(60));
  console.log('🚀 GRAPHENE PROJECT TEST SUITE');
  console.log('='.repeat(60));
  console.log(`Started at: ${new Date().toISOString()}\n`);

  // 1. Run client tests
  try {
    await runClientTests();
    results.client = { success: true };
    console.log('\n✅ Client tests completed successfully');
  } catch (error) {
    results.client = { success: false, error };
    results.errors.push(`Client tests: ${error.description || error.message}`);
    console.error('\n❌ Client tests failed:', error.description || error.message);
  }

  // 2. Run interface tests
  try {
    await runInterfaceTests();
    results.interface = { success: true };
    console.log('\n✅ Interface tests completed successfully');
  } catch (error) {
    results.interface = { success: false, error };
    results.errors.push(`Interface tests: ${error.description || error.message}`);
    console.error('\n❌ Interface tests failed:', error.description || error.message);
  }

  // 3. Run component tests
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Running Component Tests');
  console.log('='.repeat(60));
  results.component = await runComponentTests();
  const componentFailures = results.component.filter(r => !r.success);
  if (componentFailures.length > 0) {
    results.errors.push(`${componentFailures.length} component test(s) failed`);
  }

  // 4. Run standalone tests
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Running Standalone Client Tests');
  console.log('='.repeat(60));
  results.standalone = await runStandaloneClientTests();
  const standaloneFailures = results.standalone.filter(r => !r.success);
  if (standaloneFailures.length > 0) {
    results.errors.push(`${standaloneFailures.length} standalone test(s) failed`);
  }

  // Print summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Duration: ${duration}s`);
  console.log(`\nClient Tests: ${results.client?.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Interface Tests: ${results.interface?.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Component Tests: ${results.component.filter(r => r.success).length}/${results.component.length} passed`);
  console.log(`Standalone Tests: ${results.standalone.filter(r => r.success).length}/${results.standalone.length} passed`);

  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach(error => console.log(`   - ${error}`));
    console.log('\n💥 Some tests failed. Please review the output above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed successfully!');
    process.exit(0);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const testType = args[0];

if (testType === 'client') {
  runClientTests().then(() => process.exit(0)).catch(() => process.exit(1));
} else if (testType === 'interface') {
  runInterfaceTests().then(() => process.exit(0)).catch(() => process.exit(1));
} else if (testType === 'component') {
  runComponentTests().then((results) => {
    const failures = results.filter(r => !r.success);
    process.exit(failures.length > 0 ? 1 : 0);
  }).catch(() => process.exit(1));
} else if (testType === 'standalone') {
  runStandaloneClientTests().then((results) => {
    const failures = results.filter(r => !r.success);
    process.exit(failures.length > 0 ? 1 : 0);
  }).catch(() => process.exit(1));
} else {
  runAllTests();
}

