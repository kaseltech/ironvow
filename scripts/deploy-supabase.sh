#!/bin/bash

# IronVow Supabase Deployment Script
# This script helps deploy the Edge Function and migrations

set -e

echo "================================================"
echo "    IronVow Supabase Deployment"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Installing Supabase CLI..."
    brew install supabase/tap/supabase
fi

# Navigate to project root
cd "$(dirname "$0")/.."

# Step 1: Login to Supabase
echo -e "${YELLOW}Step 1: Login to Supabase${NC}"
echo "Opening browser for authentication..."
supabase login
echo -e "${GREEN}✓ Logged in successfully${NC}"
echo ""

# Step 2: Link the project
echo -e "${YELLOW}Step 2: Linking project${NC}"
PROJECT_REF="kbqrgjogyonwhhxhpodf"
supabase link --project-ref "$PROJECT_REF"
echo -e "${GREEN}✓ Project linked${NC}"
echo ""

# Step 3: Set the Anthropic API key secret
echo -e "${YELLOW}Step 3: Setting ANTHROPIC_API_KEY secret${NC}"
echo "Enter your Anthropic API key (or press Enter to skip):"
read -s ANTHROPIC_KEY
if [ -n "$ANTHROPIC_KEY" ]; then
    echo "$ANTHROPIC_KEY" | supabase secrets set ANTHROPIC_API_KEY="$ANTHROPIC_KEY"
    echo -e "${GREEN}✓ API key secret set${NC}"
else
    echo "Skipped - Edge Function will use rule-based generation"
fi
echo ""

# Step 4: Push migrations
echo -e "${YELLOW}Step 4: Pushing database migrations${NC}"
supabase db push
echo -e "${GREEN}✓ Migrations applied${NC}"
echo ""

# Step 5: Deploy Edge Function
echo -e "${YELLOW}Step 5: Deploying Edge Function${NC}"
supabase functions deploy generate-workout
echo -e "${GREEN}✓ Edge Function deployed${NC}"
echo ""

echo "================================================"
echo -e "${GREEN}    Deployment Complete!${NC}"
echo "================================================"
echo ""
echo "Your Edge Function is now live at:"
echo "https://$PROJECT_REF.supabase.co/functions/v1/generate-workout"
echo ""
echo "Test it with:"
echo "curl -X POST https://$PROJECT_REF.supabase.co/functions/v1/generate-workout \\"
echo "  -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"userId\":\"test\",\"location\":\"gym\",\"targetMuscles\":[\"chest\"],\"duration\":45,\"experienceLevel\":\"intermediate\"}'"
